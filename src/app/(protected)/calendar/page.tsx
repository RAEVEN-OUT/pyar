
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  description?: string;
  emoji?: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventEmoji, setEventEmoji] = useState('');

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
    setEventEmoji('');
    setPopoverOpen(true);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEventEmoji(emojiData.emoji);
  };

  const handleAddEvent = () => {
    if (selectedDate && eventTitle) {
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        date: selectedDate,
        title: eventTitle,
        description: eventDesc,
        emoji: eventEmoji,
      };
      setEvents([...events, newEvent]);
      setPopoverOpen(false);
      setSelectedDate(null);
    }
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
              const dayEvents = events.filter((e) => isSameDay(e.date, day));
              const stickerEmoji = dayEvents.length > 0 ? dayEvents[0].emoji : null;

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
                        'relative flex h-28 flex-col border-b border-r p-2 transition-colors hover:bg-accent/50',
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
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Add event</h4>
                        <p className="text-sm text-muted-foreground">
                          Set details for your event on{' '}
                          {format(day, 'MMMM d')}.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="title"
                            placeholder="Event title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            className="col-span-3"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                              >
                                {eventEmoji ? (
                                  <span>{eventEmoji}</span>
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
                        <Textarea
                          id="description"
                          placeholder="Event description (optional)"
                          value={eventDesc}
                          onChange={(e) => setEventDesc(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddEvent}>Add Event</Button>
                    </div>
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
