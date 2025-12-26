'use client';

import { useAuth, type User } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Smile, Mic, Square } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

type Message = {
  id: number;
  sender: User;
  text?: string;
  audioUrl?: string;
  time: string;
};

const initialMessages: Message[] = [
  { id: 1, sender: 'Her', text: 'Hey! How was your day? 🥰', time: '5:30 PM' },
  { id: 2, sender: 'Him', text: 'It was good! Just got home. Was thinking about you.', time: '5:31 PM' },
  { id: 3, sender: 'Him', text: 'What are you up to?', time: '5:31 PM' },
  { id: 4, sender: 'Her', text: 'Aww, same! Just relaxing. Wanna watch a movie tonight?', time: '5:32 PM' },
  { id: 5, sender: 'Him', text: 'Absolutely! Pick one. I am getting snacks ready 😝', time: '5:33 PM' },
  { id: 6, sender: 'Her', text: 'Sounds perfect! ❤️', time: '5:34 PM' },
];

function MoodDisplay({
  user,
  otherUser,
  moods,
  onMoodChange,
}: {
  user: User;
  otherUser: User;
  moods: { [key in User]: Mood };
  onMoodChange: (newMood: Mood) => void;
}) {
  const currentUserMood = moods[user];
  const otherUserMood = moods[otherUser];

  return (
    <div className="flex justify-between items-center p-4 border-b bg-card rounded-t-lg">
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

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [moods, setMoods] = useState<{ [key in User]: Mood }>({
    Him: { mood: 'Happy', emoji: '😊' },
    Her: { mood: 'Love u', emoji: '🥰' },
  });

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasMicPermission(true);
      })
      .catch(err => {
        setHasMicPermission(false);
        console.error("Mic permission denied", err);
      });
  }, []);

  const handleMoodChange = (newMood: Mood) => {
    if (user) {
      setMoods((prevMoods) => ({
        ...prevMoods,
        [user]: newMood,
      }));
    }
  };

  const otherUser = user === 'Him' ? 'Her' : 'Him';

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'time'>) => {
     if (!user) return;
     const newMessage: Message = {
      id: messages.length + 1,
      sender: user,
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
      ...message,
    };
    setMessages((prev) => [...prev, newMessage]);
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;
    addMessage({ text: newMessage.trim() });
    setNewMessage('');
    setShowEmojiPicker(false);
  };
  
  const handleVoiceMessage = async () => {
    if (!hasMicPermission) {
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
      return;
    }
    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if(recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      setIsRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        addMessage({ audioUrl });
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      recordingTimeoutRef.current = setTimeout(() => {
        if(mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast({
              title: "Recording limit reached",
              description: "Voice notes are limited to 60 seconds.",
            })
        }
      }, 60000);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };
  
  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="flex h-screen flex-col pt-16 md:pt-4 pb-4 px-4">
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-transparent rounded-lg shadow-md border-0">
        <MoodDisplay
          user={user}
          otherUser={otherUser}
          moods={moods}
          onMoodChange={handleMoodChange}
        />
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 chat-bg-pattern no-scrollbar">
          {!hasMicPermission && (
             <Alert variant="destructive">
              <AlertTitle>Microphone Access Required</AlertTitle>
              <AlertDescription>
                To send voice notes, please enable microphone permissions in your browser settings.
              </AlertDescription>
            </Alert>
          )}
          {messages.map((msg) => {
            const isSender = msg.sender === user;
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2',
                  isSender ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs md:max-w-md rounded-2xl p-3 shadow-sm',
                    isSender
                      ? 'bg-card rounded-br-none'
                      : 'bg-accent rounded-bl-none'
                  )}
                >
                  {msg.text && (
                    <p className={cn(
                        'text-sm',
                        isSender ? 'text-primary' : 'text-accent-foreground'
                      )}
                    >
                      {msg.text}
                    </p>
                  )}
                  {msg.audioUrl && (
                     <audio controls src={msg.audioUrl} className="w-full" />
                  )}
                   <p className={cn(
                      'text-xs mt-1',
                       isSender
                        ? 'text-primary/70'
                        : 'text-accent-foreground/70',
                      'text-right'
                    )}>
                      {msg.time}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-card rounded-b-lg">
          <div className="relative">
            <Input
              placeholder="Type your message..."
              className="pr-24 h-12 rounded-full bg-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isRecording}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="rounded-full" disabled={isRecording}>
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-0">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </PopoverContent>
              </Popover>
               <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleVoiceMessage}>
                 {isRecording ? <Square className="h-5 w-5 text-red-500 fill-red-500" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
              </Button>
              <Button type="submit" size="icon" className="rounded-full w-9 h-9" disabled={isRecording}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

    