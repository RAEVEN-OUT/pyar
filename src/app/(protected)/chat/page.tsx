'use client';

import { useAuth, type User } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Smile, Mic, Play, Pause, X, Trash2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  setDoc,
} from 'firebase/firestore';

type Mood = {
  mood: string;
  emoji: string;
};

const moodOptions: Mood[] = [
  { mood: 'Happy', emoji: '😊' },
  { mood: 'Missing you', emoji: '🥺' },
  { mood: 'Love u', emoji: '🥰' },
  { mood: 'Freaky', emoji: '😝' },
  { mood: 'Low', emoji: '😔' },
  { mood: 'Ehhh', emoji: '😅' },
  { mood: 'Angry', emoji: '😠' },
  { mood: 'Tired', emoji: '😴' },
];

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

const reactionEmojis = ['❤️', '😂', '🥰', '😍', '😢', '😮'];

function MoodDisplay({
  user,
  otherUser,
}: {
  user: User;
  otherUser: User;
}) {
  const [currentUserMood, setCurrentUserMood] = useState<Mood>(moodOptions[0]);
  const [otherUserMood, setOtherUserMood] = useState<Mood>(moodOptions[1]);

  useEffect(() => {
    const moodsRef = collection(db, 'moods');
    const unsubscribe = onSnapshot(moodsRef, snapshot => {
      snapshot.docs.forEach(d => {
        const data = d.data() as { emoji?: string; mood?: string };
        if (d.id === user.toLowerCase()) {
          const mood =
            moodOptions.find(m => m.emoji === data.emoji) || moodOptions[0];
          setCurrentUserMood(mood);
        } else if (d.id === otherUser.toLowerCase()) {
          const mood =
            moodOptions.find(m => m.emoji === data.emoji) || moodOptions[1];
          setOtherUserMood(mood);
        }
      });
    });

    return () => unsubscribe();
  }, [user, otherUser]);

  const onMoodChange = async (newMood: Mood) => {
    setCurrentUserMood(newMood);
    try {
      const moodRef = doc(db, 'moods', user.toLowerCase());
      await setDoc(
        moodRef,
        {
          emoji: newMood.emoji,
          mood: newMood.mood,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  return (
    <div className="flex justify-between items-center p-4 border-b bg-card rounded-t-lg flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{otherUserMood.emoji}</span>
        <div>
          <p className="font-semibold text-sm">{otherUser}</p>
          <p className="text-xs text-muted-foreground">{otherUserMood.mood}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 text-right cursor-pointer rounded-md p-2 hover:bg-muted transition-colors">
            <div className="flex flex-col items-end">
              <p className="font-semibold text-sm">{user}</p>
              <p className="text-xs text-muted-foreground">{currentUserMood.mood}</p>
            </div>
            <span className="text-4xl">{currentUserMood.emoji}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {moodOptions.map((mood) => (
            <DropdownMenuItem key={mood.mood} onSelect={() => onMoodChange(mood)}>
              <span className="mr-2 text-lg">{mood.emoji}</span>
              <span>{mood.mood}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const WaveformPlayer = ({ src, isSender }: { src: string; isSender: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Playback error:', err));
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const clickRatio = clickPosition / rect.width;
    const newTime = clickRatio * duration;

    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 w-56" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div
        onClick={togglePlay}
        className={cn(
          "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
          isSender ? "text-primary" : "text-accent-foreground"
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </div>

      <div
        onClick={handleWaveformClick}
        className="flex-1 h-8 flex items-center cursor-pointer relative"
      >
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isSender ? "bg-primary" : "bg-accent-foreground"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
        <div
          onClick={togglePlaybackRate}
          className={cn(
            "cursor-pointer text-xs hover:underline",
            isSender ? "text-primary/80" : "text-accent-foreground/80"
          )}
        >
          {playbackRate}x
        </div>
        <span className={cn(
          "text-xs",
          isSender ? "text-primary/70" : "text-accent-foreground/70"
        )}>
          {formatTime(duration - progress)}
        </span>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedText, setEditedText] = useState('');
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
      setShowEmojiPicker(false);
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
    setEditedText(message.text || '');
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const submitEdit = async () => {
    if (!editingMessage) return;

    try {
      const messageRef = doc(db, 'messages', editingMessage.id);
      await updateDoc(messageRef, {
        text: editedText,
        isEdited: true
      });
      setEditingMessage(null);
      setEditedText('');
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to edit message.',
      });
    }
  };

  const cleanupRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleVoiceMessage = async () => {
    if (!user) return;

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!supportedMimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);

        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prevTime => prevTime + 1);
        }, 1000);

        recordingTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          toast({
            title: "Recording limit reached",
            description: "Voice notes are limited to 60 seconds.",
          });
        }, 60000);
      };

      mediaRecorder.onstop = async () => {
        cleanupRecording();

        if (audioChunksRef.current.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Recording failed',
            description: 'No audio was captured. Please try again.',
          });
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        audioChunksRef.current = [];

        if (!audioBlob.size || audioBlob.size < 100) {
          toast({
            variant: 'destructive',
            title: 'Recording failed',
            description: 'No audio was captured. Please try again.',
          });
          return;
        }

        try {
          const timestamp = Date.now();
          const fileName = `voice_notes/${user.toLowerCase()}_${timestamp}.webm`;
          const storageRef = ref(storage, fileName);

          await uploadBytes(storageRef, audioBlob);
          const audioUrl = await getDownloadURL(storageRef);

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

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        cleanupRecording();
        audioChunksRef.current = [];
        toast({
          variant: 'destructive',
          title: 'Recording error',
          description: 'An error occurred while recording. Please try again.',
        });
      };

      mediaRecorder.start(100);
    } catch (err) {
      console.error("Microphone permission denied or error:", err);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings to send voice notes.',
      });
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupRecording();
    audioChunksRef.current = [];
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (loading || !user) {
    return null;
  }

  const otherUser = user === 'Raveen' ? 'Priya' : 'Raveen';
  const showSendButton = newMessage.trim() !== '';

  return (
    <div className="chat-root flex flex-col md:pt-4 md:pb-4 md:px-4">
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
            className="my-4"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMessage(null)}>Cancel</Button>
            <Button onClick={submitEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {messages && messages.map((msg) => {
            const isSender = msg.sender === user;
            const messageReactions = msg.reactions ? Object.entries(msg.reactions) : [];

            return (
              <div
                key={msg.id}
                id={`message-${msg.id}`}
                className={cn(
                  'flex items-end gap-2 group transition-colors duration-500 rounded-lg',
                  isSender ? 'justify-end' : 'justify-start'
                )}
              >
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          'max-w-xs md:max-w-md rounded-2xl p-0.5 shadow-sm cursor-pointer',
                          isSender ? 'bg-card' : 'bg-accent'
                        )}
                      >
                        {msg.replyTo && (
                          <div
                            onClick={() => handleScrollToMessage(msg.replyTo!.id)}
                            className="block cursor-pointer"
                          >
                            <div className={cn("p-2 text-sm rounded-t-2xl", isSender ? 'bg-black/5' : 'bg-white/10')}>
                              <p className={cn("font-semibold text-xs", isSender ? 'text-primary' : 'text-accent-foreground')}>{msg.replyTo.sender}</p>
                              <p className={cn("truncate text-xs", isSender ? 'text-primary/80' : 'text-accent-foreground/80')}>{msg.replyTo.text || 'Voice Note'}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          {msg.text && (
                            <p className={cn(
                              'text-sm',
                              isSender ? 'text-card-foreground' : 'text-accent-foreground'
                            )}>
                              {msg.text}
                            </p>
                          )}
                          {msg.audioUrl && (
                            <WaveformPlayer src={msg.audioUrl} isSender={isSender} />
                          )}
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            {msg.isEdited && <p className="text-xs text-muted-foreground">Edited</p>}
                            <p className={cn(
                              'text-xs',
                              isSender ? 'text-primary/70' : 'text-accent-foreground/70',
                              'text-right'
                            )}>
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-auto">
                      <div className="flex items-center gap-1">
                        {reactionEmojis.map(emoji => (
                          <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleReaction(msg.id, emoji)}>
                            <span className="text-lg">{emoji}</span>
                          </Button>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => handleReply(msg)}>Reply</Button>
                        {isSender && (
                          <>
                            {msg.text && <Button variant="ghost" size="sm" onClick={() => handleEdit(msg)}>Edit</Button>}
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleUnsend(msg.id)}>Unsend</Button>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {messageReactions.length > 0 && (
                    <div className={cn(
                      "absolute -bottom-3 flex gap-1",
                      isSender ? "right-2" : "left-2"
                    )}>
                      {messageReactions.map(([emoji, users]) => (
                        <div key={emoji} className="flex items-center bg-card shadow-sm rounded-full px-1.5 py-0.5 text-xs">
                          <span>{emoji}</span>
                          {users.length > 1 && <span className="ml-1 font-semibold">{users.length}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-card rounded-b-lg flex-shrink-0">
          {replyingTo && (
            <div className="p-2 mb-2 bg-input rounded-md relative text-sm">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setReplyingTo(null)}>
                <X className="h-4 w-4" />
              </Button>
              <p className="font-semibold text-primary">Replying to {replyingTo.sender}</p>
              <p className="text-muted-foreground truncate">{replyingTo.text || 'Voice Note'}</p>
            </div>
          )}
          <div className="relative flex items-center h-12">
            {isRecording ? (
              <div className="flex items-center justify-between w-full h-full rounded-full bg-input px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost"
                    className="rounded-full w-9 h-9" 
                    onClick={cancelRecording}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <Button 
                    type="button" 
                    size="icon" 
                    className="rounded-full w-9 h-9" 
                    onClick={handleVoiceMessage}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Type your message..."
                  className="pr-24 h-12 rounded-full bg-input focus-visible:ring-offset-0 focus-visible:ring-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="rounded-full">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-0">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </PopoverContent>
                  </Popover>

                  {showSendButton ? (
                    <Button 
                      type="button"
                      size="icon" 
                      className="rounded-full w-9 h-9 ml-1"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full ml-1" 
                      onClick={handleVoiceMessage}
                    >
                      <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
