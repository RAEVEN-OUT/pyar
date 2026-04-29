// src/app/(protected)/chat/page.tsx
'use client';

import { useAuth, type User } from '@/context/auth-context';
import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { MoodDisplay } from '@/components/chat/MoodDisplay';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { EditMessageDialog } from '@/components/chat/EditMessageDialog';
import { type EmojiClickData } from 'emoji-picker-react';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';

export type Message = {
  id: string;
  senderId: string;
  sender: User;
  type: 'text';
  text: string;
  timestamp: Timestamp;
  reactions?: { [emoji: string]: string[] };
  isEdited?: boolean;
  replyTo?: {
    id: string;
    sender: User;
    text: string;
  };
};

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Listen to messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((docSnap) => {
        newMessages.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Message);
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop =
        scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---------- TEXT MESSAGE ---------- */
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        type: 'text',
        senderId: user.toLowerCase(),
        sender: user,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        reactions: {},
        isEdited: false,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              sender: replyingTo.sender,
              text: replyingTo.text || '',
            }
          : null,
      });

      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ---------- OTHER HANDLERS ---------- */
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const newReactions = { ...(message.reactions || {}) };
    const users = newReactions[emoji] || [];

    if (users.includes(user.toLowerCase())) {
      newReactions[emoji] = users.filter((u) => u !== user.toLowerCase());
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
      newReactions[emoji] = [...users, user.toLowerCase()];
    }

    await updateDoc(doc(db, 'messages', messageId), {
      reactions: newReactions,
    });
  };

  const handleUnsend = async (messageId: string) => {
    await deleteDoc(doc(db, 'messages', messageId));
    // Removed toast notification for delete
  };

  const handleEdit = (message: Message) => setEditingMessage(message);
  const handleReply = (message: Message) => setReplyingTo(message);

  const submitEdit = async (editedText: string) => {
    if (!editingMessage) return;
    await updateDoc(doc(db, 'messages', editingMessage.id), {
      text: editedText,
      isEdited: true,
    });
  };

  const onEmojiClick = (emojiData: EmojiClickData) =>
    setNewMessage((prev) => prev + emojiData.emoji);

  const handleScrollToMessage = (messageId: string) => {
    document
      .getElementById(`message-${messageId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (loading || !user) return null;

  const otherUser = user === 'Raveen' ? 'Priya' : 'Raveen';

  const getDateHeader = (msg: Message, prevMsg?: Message) => {
    if (!msg.timestamp) return null;
    const date = msg.timestamp.toDate();
    const prevDate = prevMsg?.timestamp?.toDate();

    if (!prevDate || date.toDateString() !== prevDate.toDateString()) {
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      if (isSameYear(date, new Date())) return format(date, 'MMMM d');
      return format(date, 'MMMM d, yyyy');
    }
    return null;
  };

  return (
    <div className="chat-root flex flex-col md:pt-4 md:pb-4 md:px-4">
      <EditMessageDialog
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={submitEdit}
      />

      <div
        className="flex flex-col flex-1 w-full max-w-none md:max-w-4xl mx-0 md:mx-auto overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/cherry-wallpaper.jpg')" }}
      >
        <MoodDisplay user={user} otherUser={otherUser} />

        <div
          ref={scrollAreaRef}
          className="chat-messages flex-1 min-h-0 p-4 sm:p-6 space-y-4"
        >
          {messages.map((msg, index) => {
            const dateHeader = getDateHeader(msg, messages[index - 1]);
            return (
              <div key={msg.id} className="space-y-4">
                {dateHeader && (
                  <div className="flex justify-center my-6">
                    <span className="px-3 py-1 text-xs font-medium bg-black/10 text-black/60 rounded-full backdrop-blur-sm">
                      {dateHeader}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  currentUser={user}
                  onReaction={handleReaction}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onUnsend={handleUnsend}
                  onScrollToMessage={handleScrollToMessage}
                />
              </div>
            );
          })}
        </div>

        <MessageInput
          message={newMessage}
          onMessageChange={setNewMessage}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          onEmojiClick={onEmojiClick}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}