
'use client';

import { useState } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { NotebookText, Edit, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { isFuture, isSameMonth, isToday } from 'date-fns';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { type CaptionProps } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

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


function CustomCaption(props: CaptionProps) {
    const isCurrentMonth = isSameMonth(new Date(), props.displayMonth);

    return (
      <div className="flex justify-between items-center px-2 mb-4">
         <Button
          aria-label="Go to previous month"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => props.onMonthChange && props.onMonthChange(new Date(props.displayMonth.getFullYear(), props.displayMonth.getMonth() - 1))}
         >
           <ChevronLeft className="h-4 w-4" />
         </Button>
         <h2 className="text-2xl font-headline">{format(props.displayMonth, 'MMMM yyyy')}</h2>
         <Button
          aria-label="Go to next month"
          variant="outline"
          className={cn("h-7 w-7 p-0", isCurrentMonth && "invisible")}
          onClick={() => props.onMonthChange && props.onMonthChange(new Date(props.displayMonth.getFullYear(), props.displayMonth.getMonth() + 1))}
          disabled={isCurrentMonth}
         >
           <ChevronRight className="h-4 w-4" />
         </Button>
      </div>
    );
}


export default function NotesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notes, setNotes] = useState<AllNotes>(initialNotes);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dailyNotes = notes[dateString] || {};
  
  const handleSaveNote = (userToSave: User) => (content: string) => {
    if (!selectedDate || !user) return;
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
  
  const canEditSelectedDate = selectedDate ? isToday(selectedDate) : false;

  return (
    <div className="flex flex-col md:flex-row h-full p-4 gap-4 md:p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-2xl font-headline text-primary self-start">
           <NotebookText className="h-8 w-8 text-primary" />
           Our Shared Notes
        </div>
        <Card className="p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            showOutsideDays={false}
            className="rounded-md"
            classNames={{
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              cell: 'h-9 w-9 text-center text-sm p-0 relative',
              day: cn(
                'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full',
                '[&:not([aria-disabled])]:hover:bg-accent [&:not([aria-disabled])]:hover:text-accent-foreground'
              ),
              day_today: 'bg-primary text-primary-foreground rounded-full',
              day_selected:
                'bg-transparent text-foreground ring-2 ring-primary ring-offset-background !rounded-full focus:ring-primary',
              day_disabled: 'text-muted-foreground opacity-50 cursor-default',
            }}
            modifiers={{
              hasNote: Object.keys(notes).map(dateStr => new Date(dateStr.replace(/-/g, '/'))),
              disabled: isFuture,
            }}
            modifiersClassNames={{
              hasNote: 'font-bold text-primary',
            }}
            components={{
                Caption: CustomCaption,
            }}
          />
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-headline text-primary">
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
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
