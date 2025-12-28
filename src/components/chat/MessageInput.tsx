// src/components/chat/MessageInput.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile, Mic, Trash2, X } from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { type Message } from '@/app/(protected)/chat/page';

interface MessageInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEmojiClick: (emojiData: EmojiClickData) => void;
  
  // Voice recording props
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopAndSend: () => void;
  onCancelRecording: () => void;
  
  // Reply props
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export function MessageInput({
  message,
  onMessageChange,
  onSend,
  onKeyPress,
  onEmojiClick,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopAndSend,
  onCancelRecording,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const showSendButton = message.trim() !== '';

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  return (
    <div className="p-4 border-t bg-card rounded-b-lg flex-shrink-0">
      {replyingTo && (
        <div className="p-2 mb-2 bg-input rounded-md relative text-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1 right-1 h-6 w-6" 
            onClick={onCancelReply}
          >
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
                onClick={onCancelRecording}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                className="rounded-full w-9 h-9" 
                onClick={onStopAndSend}
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
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={onKeyPress}
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
                  onClick={onSend}
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full ml-1" 
                  onClick={onStartRecording}
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}