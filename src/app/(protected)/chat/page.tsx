'use client';

import { useAuth, type User } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Smile, Mic } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  text: string;
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
      {/* Other User's Mood (Left) */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{otherUserMood.emoji}</span>
        <div>
          <p className="font-semibold text-sm">{otherUser}</p>
          <p className="text-xs text-muted-foreground">{otherUserMood.mood}</p>
        </div>
      </div>

      {/* Current User's Mood (Right) - Interactive */}
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [moods, setMoods] = useState<{ [key in User]: Mood }>({
    Him: { mood: 'Happy', emoji: '😊' },
    Her: { mood: 'Love u', emoji: '🥰' },
  });

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const message: Message = {
      id: messages.length + 1,
      sender: user,
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    setShowEmojiPicker(false);
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
                {!isSender && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {msg.sender.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md rounded-2xl p-3 shadow-sm',
                    isSender
                      ? 'bg-card rounded-br-none'
                      : 'bg-accent rounded-bl-none'
                  )}
                >
                  <p className={cn(
                      'text-sm',
                      isSender ? 'text-primary' : 'text-primary-foreground'
                    )}
                  >
                    {msg.text}
                  </p>
                   <p className={cn(
                      'text-xs mt-1',
                       isSender
                        ? 'text-primary/70'
                        : 'text-primary-foreground/70',
                      'text-right'
                    )}>
                      {msg.time}
                    </p>
                </div>
                {isSender && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {msg.sender.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                )}
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
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
               <Button type="button" variant="ghost" size="icon" className="rounded-full">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button type="submit" size="icon" className="rounded-full w-9 h-9">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
