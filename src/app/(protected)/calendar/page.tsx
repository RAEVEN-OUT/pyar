
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Smile,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  add,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';


type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  description?: string;
};

type CalendarSticker = {
  id: string; // yyyy-MM-dd
  emoji: string;
};

type ViewMode = 'add' | 'view';

const mockEvents: CalendarEvent[] = [
    { id: '1', date: new Date().toISOString(), title: "Today's Special Event", description: "This is a description for today's event." },
];

const mockStickers: CalendarSticker[] = [
    { id: format(add(new Date(), { days: -2 }), 'yyyy-MM-dd'), emoji: '💖' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [stickers, setStickers] = useState<CalendarSticker[]>(mockStickers);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('add');

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const startOfCalendar = startOfWeek(firstDayOfMonth);
  const endOfCalendar = endOfWeek(lastDayOfMonth);

  const days = eachDayOfInterval({
    start: startOfCalendar,
    end: endOfCalendar,
  });

  const nextMonth = () => {
    setCurrentDate(add(currentDate, { months: 1 }));
  };

  const prevMonth = () => {
    setCurrentDate(add(currentDate, { months: -1 }));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEventTitle('');
    setEventDesc('');
    
    const dayHasEvents = events?.some(e => isSameDay(new Date(e.date), day));
    if (dayHasEvents) {
      setViewMode('view');
    } else {
      setViewMode('add');
    }
    
    setPopoverOpen(true);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setStickers(prev => {
        const existing = prev.find(s => s.id === dateKey);
        if (existing) {
          return prev.map(s => s.id === dateKey ? { ...s, emoji: emojiData.emoji } : s);
        }
        return [...prev, { id: dateKey, emoji: emojiData.emoji }];
      });
    }
  };

  const handleAddEvent = () => {
    if (selectedDate && eventTitle && user) {
      const newEvent: CalendarEvent = {
        id: new Date().toISOString(),
        date: selectedDate.toISOString(),
        title: eventTitle,
        description: eventDesc,
      };
      setEvents(prev => [...prev, newEvent]);
      setPopoverOpen(false);
      setSelectedDate(null);
    }
  };
  
  const dayEvents = useMemo(() => {
    if (!selectedDate || !events) return [];
    return events.filter((e) => isSameDay(new Date(e.date), selectedDate));
  }, [events, selectedDate]);
  
  const selectedSticker = useMemo(() => {
    if (!selectedDate || !stickers) return undefined;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return stickers.find(s => s.id === dateKey)?.emoji;
  }, [stickers, selectedDate]);


  const renderPopoverContent = () => {
    if (!selectedDate) return null;

    if (viewMode === 'view' && dayEvents.length > 0) {
      return (
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium leading-none">
                {format(selectedDate, 'MMMM d')}
              </h4>
               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewMode('add')}>
                 <Plus className="h-4 w-4" />
               </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your events for this day.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {dayEvents.map(event => (
              <AccordionItem key={event.id} value={event.id}>
                <AccordionTrigger className="truncate">{event.title}</AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-24 pr-4">
                    {event.description || <p className="text-sm text-muted-foreground italic">No description provided.</p>}
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">Add details</h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  {selectedSticker ? (
                    <span>{selectedSticker}</span>
                  ) : (
                    <Smile className="h-5 w-5" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-muted-foreground">
            Add an event or a sticker for{' '}
            {format(selectedDate, 'MMMM d')}.
          </p>
        </div>
        <div className="grid gap-2">
          <Input
            id="title"
            placeholder="Event title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="col-span-3"
            maxLength={30}
          />
          <Textarea
            id="description"
            placeholder="Event description (optional)"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
          />
        </div>
        <Button onClick={handleAddEvent} disabled={!eventTitle}>Add Event</Button>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <Card className="flex flex-1 flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2 text-2xl font-headline">
            <CalendarDays className="hidden h-8 w-8 text-primary sm:block" />
            <h2 className="text-xl font-semibold sm:text-2xl">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="grid flex-1 grid-cols-7">
            {weekDays.map((day) => (
              <div
                key={day}
                className="border-b border-r p-2 text-center text-sm font-medium text-muted-foreground"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}

            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events?.filter((e) => isSameDay(new Date(e.date), day)) || [];
              const stickerEmoji = stickers?.find(s => s.id === dateKey)?.emoji;
              
              return (
                <Popover
                  key={day.toString()}
                  open={isSameDay(day, selectedDate || new Date(0)) && popoverOpen}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedDate(null);
                      setPopoverOpen(false);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'relative flex h-28 flex-col border-b border-r p-2 transition-colors hover:bg-accent/50 cursor-pointer',
                        !isSameMonth(day, currentDate) &&
                          'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm self-start',
                          isToday(day) &&
                            'bg-primary text-primary-foreground font-semibold'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {stickerEmoji && (
                        <span className="absolute right-2 top-2 text-xl">
                          {stickerEmoji}
                        </span>
                      )}
                      <div className="mt-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-1 rounded-sm bg-primary/20 px-1 py-0.5 text-xs"
                          >
                            <span className="truncate font-semibold text-primary">
                              {event.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    {renderPopoverContent()}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
