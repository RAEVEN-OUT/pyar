'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="flex h-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <CalendarDays className="h-8 w-8 text-primary" />
            Our Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </CardContent>
      </Card>
    </div>
  );
}
