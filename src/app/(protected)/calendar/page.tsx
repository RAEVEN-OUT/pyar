
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

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
                className="border-b border-r text-center text-sm font-medium text-muted-foreground p-2"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}

            {days.map((day) => (
              <div
                key={day.toString()}
                className={cn(
                  'relative flex flex-col border-b border-r p-2 transition-colors hover:bg-accent/50',
                  !isSameMonth(day, currentDate) &&
                    'bg-muted/50 text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                    isToday(day) &&
                      'bg-primary text-primary-foreground font-semibold'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {/* Events would go here */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
