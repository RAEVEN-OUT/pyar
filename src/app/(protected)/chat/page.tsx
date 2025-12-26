'use client';

import { useAuth, type User } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Smile, Mic, Play, Pause, X } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  reactions?: { [emoji: string]: User[] };
  isEdited?: boolean;
  replyTo?: Message;
};

const initialMessages: Message[] = [
  { id: 1, sender: 'Her', text: 'Hey! How was your day? 🥰', time: '5:30 PM', reactions: { '❤️': ['Him'] } },
  { id: 2, sender: 'Him', text: 'It was good! Just got home. Was thinking about you.', time: '5:31 PM' },
  { id: 3, sender: 'Him', text: 'What are you up to?', time: '5:31 PM' },
  { id: 4, sender: 'Her', text: 'Aww, same! Just relaxing. Wanna watch a movie tonight?', time: '5:32 PM' },
  { id: 5, sender: 'Him', text: 'Absolutely! Pick one. I am getting snacks ready 😝', time: '5:33 PM', reactions: { '🥰': ['Her'] } },
  { id: 6, sender: 'Her', text: 'Sounds perfect! ❤️', time: '5:34 PM' },
];

const reactionEmojis = ['❤️', '😂', '🥰', '😍', '😢', '😮'];


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

const WaveformPlayer = ({ src, isSender }: { src: string, isSender: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const waveform = waveformRef.current;
    if (!audio || !waveform || !duration) return;

    const rect = waveform.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const clickRatio = clickPosition / rect.width;
    const newTime = clickRatio * duration;
    
    audio.currentTime = newTime;
    setProgress(newTime);
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
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };
  
  const togglePlaybackRate = () => {
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };


  const progressPercentage = duration ? (progress / duration) * 100 : 0;
  
  const waveColor = isSender ? 'hsl(var(--primary))' : 'hsl(var(--accent-foreground))';
  const waveInactiveColor = isSender ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--accent-foreground) / 0.3)';

  return (
    <div className="flex items-center gap-2 w-56">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <Button onClick={togglePlay} variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full flex-shrink-0", isSender ? "text-primary hover:text-primary" : "text-accent-foreground hover:text-accent-foreground")}>
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </Button>
      <div ref={waveformRef} onClick={handleWaveformClick} className="flex-1 h-8 flex items-center cursor-pointer" style={{'--wave-color': waveColor, '--wave-inactive-color': waveInactiveColor, '--progress': `${progressPercentage}%`} as React.CSSProperties}>
         <div className="w-full h-full relative bg-gradient-to-r from-[var(--wave-color)] to-[var(--wave-color)] bg-no-repeat bg-left" style={{'backgroundSize': 'var(--progress) 100%'}}>
             <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-r from-[var(--wave-inactive-color)] to-[var(--wave-inactive-color)] bg-no-repeat bg-left" style={{'mask': `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M2 9.5C2 9.5 2.5 4 4 4C5.5 4 6.5 15 8 15C9.5 15 10.5 4 12 4C13.5 4 14.5 15 16 15C17.5 15 18.5 4 20 4C21.5 4 22.5 15 24 15C25.5 15 26.5 4 28 4C29.5 4 30.5 15 32 15C33.5 15 34.5 4 36 4C37.5 4 38.5 15 40 15C41.5 15 42.5 4 44 4C45.5 4 46.5 15 48 15C49.5 15 50.5 4 52 4C53.5 4 54.5 15 56 15C57.5 15 58.5 4 60 4C61.5 4 62.5 15 64 15C65.5 15 66.5 4 68 4C69.5 4 70.5 15 72 15C73.5 15 74.5 4 76 4C77.5 4 78.5 15 80 15C81.5 15 82.5 4 84 4C85.5 4 86.5 15 88 15C89.5 15 90.5 4 92 4C93.5 4 94.5 15 96 15C97.5 15 98.5 4 100 4' fill='none' stroke='black' stroke-width='2'/%3e%3c/svg%3e")`, 'maskSize': '100% 100%'}}></div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
          <Button variant="link" size="sm" onClick={togglePlaybackRate} className={cn("h-auto p-0 text-xs", isSender ? "text-primary/80" : "text-accent-foreground/80")}>
             {playbackRate}x
          </Button>
          <span className={cn("text-xs", isSender ? "text-primary/70" : "text-accent-foreground/70")}>{formatTime(duration - progress)}</span>
      </div>
    </div>
  );
};


export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timer | null>(null);

  const [moods, setMoods] = useState<{ [key in User]: Mood }>({
    Him: { mood: 'Happy', emoji: '😊' },
    Her: { mood: 'Love u', emoji: '🥰' },
  });

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedText, setEditedText] = useState('');

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
            setHasMicPermission(true);
        } else if (result.state === 'denied') {
            setHasMicPermission(false);
        } else {
            setHasMicPermission(null); 
        }
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
     const newMessageData: Message = {
      id: Date.now(),
      sender: user,
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
      ...message,
    };
    setMessages((prev) => [...prev, newMessageData]);
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    let message: Omit<Message, 'id' | 'time'> = { text: newMessage.trim() };
    if (replyingTo) {
      message = { ...message, replyTo: replyingTo };
    }
    
    addMessage(message);

    setNewMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    if (!user) return;
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        
        if (reactions[emoji] && reactions[emoji].includes(user)) {
          reactions[emoji] = reactions[emoji].filter(u => u !== user);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji] = [...(reactions[emoji] || []), user];
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const handleUnsend = (messageId: number) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };
  
  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setEditedText(message.text || '');
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  }

  const submitEdit = () => {
    if (!editingMessage) return;
    setMessages(messages.map(msg => 
      msg.id === editingMessage.id 
        ? { ...msg, text: editedText, isEdited: true } 
        : msg
    ));
    setEditingMessage(null);
    setEditedText('');
  };

  
  const stopRecording = (send: boolean) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (!send) {
         if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
         if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
         setIsRecording(false);
         setRecordingTime(0);
         mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      }
    }
  }

  const handleVoiceMessage = async () => {
    if (isRecording) {
        stopRecording(true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.onstart = () => {
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

            recordingTimeoutRef.current = setTimeout(() => {
                stopRecording(true);
                toast({
                    title: "Recording limit reached",
                    description: "Voice notes are limited to 60 seconds.",
                });
            }, 60000);
        };
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
            setIsRecording(false);
            setRecordingTime(0);

            if (audioChunks.length > 0) {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              let message: Omit<Message, 'id' | 'time'> = { audioUrl };
              if (replyingTo) {
                message = { ...message, replyTo: replyingTo };
              }
              addMessage(message);
              setReplyingTo(null);
            }
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();

    } catch (err) {
        setHasMicPermission(false);
        console.error("Mic permission denied", err);
        toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings to send voice notes.',
        });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }
  
  if (!user) {
    return null;
  }

  const showSendButton = newMessage.trim() !== '';

  return (
    <div className="flex h-screen flex-col pt-16 md:pt-4 pb-4 px-4">
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
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-transparent rounded-lg shadow-md border-0">
        <MoodDisplay
          user={user}
          otherUser={otherUser}
          moods={moods}
          onMoodChange={handleMoodChange}
        />
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 chat-bg-pattern no-scrollbar">
          {hasMicPermission === false && (
             <Alert variant="destructive">
              <AlertTitle>Microphone Access Required</AlertTitle>
              <AlertDescription>
                To send voice notes, please enable microphone permissions in your browser settings.
              </AlertDescription>
            </Alert>
          )}
          {messages.map((msg) => {
            const isSender = msg.sender === user;
            const messageReactions = msg.reactions ? Object.entries(msg.reactions) : [];

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2 group',
                  isSender ? 'justify-end' : 'justify-start'
                )}
              >
                 <div className="relative">
                    <Popover>
                        <PopoverTrigger asChild>
                             <div
                              className={cn(
                                'max-w-xs md:max-w-md rounded-2xl p-0.5 shadow-sm cursor-pointer',
                                isSender
                                  ? 'bg-card'
                                  : 'bg-accent'
                              )}
                            >
                              {msg.replyTo && (
                                <div className={cn("p-2 text-sm rounded-t-2xl", isSender ? 'bg-black/5' : 'bg-white/10')}>
                                  <p className={cn("font-semibold text-xs", isSender ? 'text-primary' : 'text-accent-foreground')}>{msg.replyTo.sender}</p>
                                  <p className={cn("truncate text-xs", isSender ? 'text-primary/80' : 'text-accent-foreground/80')}>{msg.replyTo.text || 'Voice Note'}</p>
                                </div>
                              )}
                              <div className="p-3">
                                {msg.text && (
                                  <p className={cn(
                                    'text-sm',
                                    isSender ? 'text-primary' : 'text-accent-foreground'
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
                                     isSender
                                      ? 'text-primary/70'
                                      : 'text-accent-foreground/70',
                                    'text-right'
                                  )}>
                                    {msg.time}
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
                                {isSender && msg.text && (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(msg)}>Edit</Button>
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
        <div className="p-4 border-t bg-card rounded-b-lg">
          {replyingTo && (
            <div className="p-2 mb-2 bg-input rounded-md relative text-sm">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setReplyingTo(null)}>
                  <X className="h-4 w-4" />
                </Button>
                <p className="font-semibold text-primary">Replying to {replyingTo.sender}</p>
                <p className="text-muted-foreground truncate">{replyingTo.text || 'Voice Note'}</p>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="relative flex items-center h-12">
            {isRecording ? (
               <div className="flex items-center justify-between w-full h-full rounded-full bg-input px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</p>
                  </div>
                   <Button type="button" size="icon" className="rounded-full w-9 h-9" onClick={() => stopRecording(true)}>
                     <Send className="h-5 w-5" />
                   </Button>
               </div>
            ) : (
              <>
                <Input
                  placeholder="Type your message..."
                  className="pr-24 h-12 rounded-full bg-input focus-visible:ring-offset-0 focus-visible:ring-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
                     <Button type="submit" size="icon" className="rounded-full w-9 h-9">
                        <Send className="h-5 w-5" />
                     </Button>
                  ) : (
                     <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleVoiceMessage}>
                       <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
