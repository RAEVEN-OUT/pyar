'use client';

import { useAuth, type User } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, Smile, Mic } from 'lucide-react';
import { useRef, useEffect } from 'react';

const moods: { [key in User]: { mood: string; emoji: string } } = {
  Him: { mood: 'Happy', emoji: '😊' },
  Her: { mood: 'Love u', emoji: '🥰' },
};

const mockMessages = [
  { id: 1, sender: 'Her' as User, text: 'Hey! How was your day? 🥰', time: '5:30 PM' },
  { id: 2, sender: 'Him' as User, text: 'It was good! Just got home. Was thinking about you.', time: '5:31 PM' },
  { id: 3, sender: 'Him' as User, text: 'What are you up to?', time: '5:31 PM' },
  { id: 4, sender: 'Her' as User, text: 'Aww, same! Just relaxing. Wanna watch a movie tonight?', time: '5:32 PM' },
  { id: 5, sender: 'Him' as User, text: 'Absolutely! Pick one. I am getting snacks ready 😝', time: '5:33 PM' },
  { id: 6, sender: 'Her' as User, text: 'Sounds perfect! ❤️', time: '5:34 PM' },
];

function MoodDisplay() {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-card rounded-t-lg">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{moods.Him.emoji}</span>
        <div>
          <p className="font-semibold text-sm">Him</p>
          <p className="text-xs text-muted-foreground">{moods.Him.mood}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div className="flex flex-col items-end">
          <p className="font-semibold text-sm">Her</p>
          <p className="text-xs text-muted-foreground">{moods.Her.mood}</p>
        </div>
        <span className="text-4xl">{moods.Her.emoji}</span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);


  return (
    <div className="flex h-screen flex-col pt-16 md:pt-4 pb-4 px-4">
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-background rounded-lg shadow-md border">
        <MoodDisplay />
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 chat-bg-pattern">
          {mockMessages.map((msg) => {
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
                      ? 'bg-card text-primary rounded-br-none'
                      : 'bg-accent text-[hsl(var(--background))] rounded-bl-none filter drop-shadow-sm'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                   <p className={cn(
                      'text-xs mt-1',
                      isSender ? 'text-muted-foreground' : 'text-[hsl(var(--background))] opacity-70',
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
        <div className="p-4 border-t bg-card rounded-b-lg">
          <div className="relative">
            <Input
              placeholder="Type your message..."
              className="pr-24 h-12 rounded-full"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
               <Button variant="ghost" size="icon" className="rounded-full">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button size="icon" className="rounded-full w-9 h-9">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
