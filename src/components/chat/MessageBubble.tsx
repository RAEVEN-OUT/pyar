// src/components/chat/MessageBubble.tsx
'use client';

import { type Message } from '@/app/(protected)/chat/page';
import { type User } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { WaveformPlayer } from './WaveformPlayer';

const reactionEmojis = ['❤️', '😂', '🥰', '😍', '😢', '😮'];

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onUnsend: (messageId: string) => void;
  onScrollToMessage: (messageId: string) => void;
}

export function MessageBubble({
  message,
  currentUser,
  onReaction,
  onReply,
  onEdit,
  onUnsend,
  onScrollToMessage,
}: MessageBubbleProps) {
  const isSender = message.sender === currentUser;
  const messageReactions = message.reactions ? Object.entries(message.reactions) : [];

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div
      id={`message-${message.id}`}
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
              {message.replyTo && (
                <div
                  onClick={() => onScrollToMessage(message.replyTo!.id)}
                  className="block cursor-pointer"
                >
                  <div className={cn("p-2 text-sm rounded-t-2xl", isSender ? 'bg-black/5' : 'bg-white/10')}>
                    <p className={cn("font-semibold text-xs", isSender ? 'text-primary' : 'text-accent-foreground')}>
                      {message.replyTo.sender}
                    </p>
                    <p className={cn("truncate text-xs", isSender ? 'text-primary/80' : 'text-accent-foreground/80')}>
                      {message.replyTo.text || 'Voice Note'}
                    </p>
                  </div>
                </div>
              )}
              <div className="p-3">
                {message.text && (
                  <p className={cn(
                    'text-sm',
                    isSender ? 'text-card-foreground' : 'text-accent-foreground'
                  )}>
                    {message.text}
                  </p>
                )}
                {message.audioUrl && (
                  <WaveformPlayer src={message.audioUrl} isSender={isSender} />
                )}
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  {message.isEdited && <p className="text-xs text-muted-foreground">Edited</p>}
                  <p className={cn(
                    'text-xs',
                    isSender ? 'text-primary/70' : 'text-accent-foreground/70',
                    'text-right'
                  )}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-1 w-auto">
            <div className="flex items-center gap-1">
              {reactionEmojis.map(emoji => (
                <Button 
                  key={emoji} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => onReaction(message.id, emoji)}
                >
                  <span className="text-lg">{emoji}</span>
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => onReply(message)}>Reply</Button>
              {isSender && (
                <>
                  {message.text && <Button variant="ghost" size="sm" onClick={() => onEdit(message)}>Edit</Button>}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onUnsend(message.id)}>
                    Unsend
                  </Button>
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
}