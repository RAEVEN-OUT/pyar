
'use client';

import { useState } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { NotebookText, Edit, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { isFuture, isSameMonth, isToday, format, add, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

type Note = {
  content: string;
  lastUpdated: string;
};

type DailyNotes = {
  [key in User]?: Note;
};

type AllNotes = {
  [date: string]: DailyNotes;
};

const initialNotes: AllNotes = {
  [format(new Date(), 'yyyy-MM-dd')]: {
    Her: {
      content: 'Started our shared journal today! So excited to fill this with memories. 💕',
      lastUpdated: '10:15 AM',
    },
    Him: {
      content: 'What a great idea! Can\'t wait to write here with you.',
      lastUpdated: '10:20 AM',
    },
  },
  [format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')]: {
    Him: {
      content: 'Remember that little coffee shop we found? We should go back this weekend.',
      lastUpdated: 'Yesterday 3:30 PM',
    }
  }
};


const NoteEditor = ({
  noteUser,
  currentUser,
  note,
  onSave,
  colorClass,
  canEdit,
}: {
  noteUser: User;
  currentUser: User;
  note: Note | undefined;
  onSave: (content: string) => void;
  colorClass: string;
  canEdit: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note?.content || '');

  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };

  const showEditButton = canEdit && noteUser === currentUser;

  return (
    <Card className={cn('flex flex-col h-full', colorClass)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-headline">
          {noteUser === 'Him' ? 'His Note' : 'Hers Note'}
        </CardTitle>
        {showEditButton && (
            isEditing ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                <Save className="h-4 w-4" />
            </Button>
            ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
            </Button>
            )
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        {isEditing ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
            placeholder="Write your thoughts..."
          />
        ) : (
          <div className="flex-1 p-2 text-sm whitespace-pre-wrap font-body">
            {note?.content || <p className="text-muted-foreground italic">No note yet.</p>}
          </div>
        )}
         {note && !isEditing && (
            <p className="text-xs text-muted-foreground self-end">
                Last updated: {note.lastUpdated}
            </p>
        )}
      </CardContent>
    </Card>
  );
};

const NotesCalendar = ({
  selectedDate,
  onDateSelect,
  notes,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  notes: AllNotes;
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const startOfCalendar = startOfWeek(firstDayOfMonth);
  const endOfCalendar = endOfWeek(lastDayOfMonth);

  const days = eachDayOfInterval({
    start: startOfCalendar,
    end: endOfCalendar,
  });

  const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
  const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const noteDates = Object.keys(notes).map(dateStr => new Date(dateStr.replace(/-/g, '/')));

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <h2 className="text-lg font-semibold sm:text-xl font-headline">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth} disabled={isFuture(firstDayOfMonth)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map(day => {
            const hasNote = noteDates.some(noteDate => isSameDay(noteDate, day));
            return (
              <div
                key={day.toString()}
                onClick={() => onDateSelect(day)}
                className={cn(
                  'relative flex items-center justify-center h-9 w-full rounded-full cursor-pointer transition-colors',
                  !isSameMonth(day, currentDate) && 'text-muted-foreground/50',
                  isSameDay(day, selectedDate) && !isToday(day) && 'bg-accent/50 text-accent-foreground',
                  isToday(day) && 'bg-primary text-primary-foreground',
                  !isSameDay(day, selectedDate) && !isToday(day) && '[&:not([aria-disabled])]:hover:bg-accent/30',
                  isFuture(day) && 'text-muted-foreground/30 cursor-default pointer-events-none'
                )}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                {hasNote && <div className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export default function NotesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<AllNotes>(initialNotes);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dailyNotes = notes[dateString] || {};
  
  const handleSaveNote = (userToSave: User) => (content: string) => {
    if (!user) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    
    const newNote: Note = {
      content,
      lastUpdated: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
    };

    setNotes(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [userToSave]: newNote,
      },
    }));
  };

  if (!user) return null;

  const otherUser = user === 'Him' ? 'Her' : 'Him';
  
  const canEditSelectedDate = isToday(selectedDate);

  return (
    <div className="flex flex-col md:flex-row h-full p-4 gap-4 md:p-8">
      <div className="flex flex-col items-center gap-4 md:w-80 lg:w-96">
        <div className="flex items-center gap-2 text-2xl font-headline text-primary self-start">
           <NotebookText className="h-8 w-8 text-primary" />
           Our Shared Notes
        </div>
        <NotesCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          notes={notes}
        />
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-headline text-primary">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h2>
        <div className={cn(
          "grid flex-1 gap-4",
          isMobile ? "grid-rows-2" : "grid-cols-2"
        )}>
          <NoteEditor
            noteUser={user}
            currentUser={user}
            note={dailyNotes[user]}
            onSave={handleSaveNote(user)}
            colorClass="bg-card text-card-foreground"
            canEdit={canEditSelectedDate}
          />
          <NoteEditor
            noteUser={otherUser}
            currentUser={user}
            note={dailyNotes[otherUser]}
            onSave={handleSaveNote(otherUser)}
            colorClass="bg-accent text-accent-foreground"
            canEdit={false}
          />
        </div>
      </div>
    </div>
  );
}
