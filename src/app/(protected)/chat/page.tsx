// src/app/(protected)/chat/page.tsx
'use client';

import { useAuth, type User } from '@/context/auth-context';
import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

export type Message = {
  id: string;
  senderId: string;
  sender: User;
  text?: string;
  audioUrl?: string;
  storagePath?: string;
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
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Listen to messages from Firestore
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.toLowerCase(),
        sender: user,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        reactions: {},
        isEdited: false,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          sender: replyingTo.sender,
          text: replyingTo.text || 'Voice Note',
        } : null,
      });

      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const newReactions = { ...(message.reactions || {}) };
    const usersForEmoji = newReactions[emoji] || [];

    if (usersForEmoji.includes(user.toLowerCase())) {
      newReactions[emoji] = usersForEmoji.filter((uid) => uid !== user.toLowerCase());
      if (newReactions[emoji].length === 0) {
        delete newReactions[emoji];
      }
    } else {
      newReactions[emoji] = [...usersForEmoji, user.toLowerCase()];
    }

    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { reactions: newReactions });
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleUnsend = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      if (message.audioUrl && message.storagePath && message.senderId === user?.toLowerCase()) {
        try {
          const storageRef = ref(storage, message.storagePath);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.error('Error deleting voice note from storage:', storageError);
        }
      }

      await deleteDoc(doc(db, 'messages', messageId));
      toast({ title: 'Message deleted' });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete message.',
      });
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const submitEdit = async (editedText: string) => {
    if (!editingMessage) return;

    try {
      const messageRef = doc(db, 'messages', editingMessage.id);
      await updateDoc(messageRef, {
        text: editedText,
        isEdited: true
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to edit message.',
      });
    }
  };

  const handleStopAndSendVoiceNote = async () => {
    if (!user) return;

    const audioBlob = await stopRecording();

    if (!audioBlob) {
      toast({
        variant: 'destructive',
        title: 'Recording failed',
        description: 'No audio was captured. Please try again.',
      });
      return;
    }

    if (audioBlob.size < 100) {
      toast({
        variant: 'destructive',
        title: 'Recording failed',
        description: 'Audio file is too small. Please try again.',
      });
      return;
    }

    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `voice_notes/${user.toLowerCase()}_${timestamp}.webm`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, audioBlob);
      const audioUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'messages'), {
        senderId: user.toLowerCase(),
        sender: user,
        audioUrl,
        storagePath: fileName,
        timestamp: serverTimestamp(),
        reactions: {},
        replyTo: replyingTo ? {
          id: replyingTo.id,
          sender: replyingTo.sender,
          text: replyingTo.text || 'Voice Note',
        } : null,
      });

      setReplyingTo(null);
      toast({
        title: 'Voice note sent',
        description: 'Your voice message has been sent successfully.',
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send voice message. Please try again.',
      });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  const handleScrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 1000);
    }
  };

  if (loading || !user) {
    return null;
  }

  const otherUser = user === 'Raveen' ? 'Priya' : 'Raveen';

  return (
    <div className="chat-root flex flex-col md:pt-4 md:pb-4 md:px-4">
      <EditMessageDialog
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={submitEdit}
      />

      <div
        className="flex flex-col flex-1 w-full max-w-none md:max-w-4xl mx-0 md:mx-auto rounded-none md:rounded-lg shadow-none md:shadow-md overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/cherry-wallpaper.jpg')" }}
      >
        <MoodDisplay user={user} otherUser={otherUser} />

        <div
          ref={scrollAreaRef}
          className="chat-messages flex-1 min-h-0 p-4 sm:p-6 space-y-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages && messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUser={user}
              onReaction={handleReaction}
              onReply={handleReply}
              onEdit={handleEdit}
              onUnsend={handleUnsend}
              onScrollToMessage={handleScrollToMessage}
            />
          ))}
        </div>

        <MessageInput
          message={newMessage}
          onMessageChange={setNewMessage}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          onEmojiClick={onEmojiClick}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopAndSend={handleStopAndSendVoiceNote}
          onCancelRecording={cancelRecording}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}