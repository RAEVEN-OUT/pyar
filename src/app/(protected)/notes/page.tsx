
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { NotebookText, Edit, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { isFuture, isSameMonth, isToday, format, add, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Note = {
  id: string; // "yyyy-MM-dd-Him" or "yyyy-MM-dd-Her"
  author: User;
  date: string; // 'yyyy-MM-dd'
  text: string;
  lastUpdated: string;
};

const NoteEditor = ({
  noteUser,
  currentUser,
  note,
  onSave,
  colorClass,
  canEdit,
  selectedDate,
}: {
  noteUser: User;
  currentUser: User;
  note: Note | undefined;
  onSave: (content: string) => void;
  colorClass: string;
  canEdit: boolean;
  selectedDate: Date;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note?.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(note?.text || '');
    setIsEditing(false); 
  }, [note, selectedDate]);
  
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      autoResizeTextarea();
    }
  }, [isEditing, text]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    autoResizeTextarea();
  };

  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(text.length, text.length);
      autoResizeTextarea();
    }, 0);
  }

  const showEditButton = canEdit && noteUser === currentUser;

  return (
    <Card className={cn('flex flex-col', colorClass)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-headline">
          {noteUser === 'Him' ? 'His Note' : 'Her Note'}
        </CardTitle>
        {showEditButton && (
            isEditing ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                <Save className="h-4 w-4" />
            </Button>
            ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
            </Button>
            )
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-2">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            className="w-full resize-none overflow-hidden bg-transparent p-2 font-body text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Write your thoughts..."
            rows={1}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-[80px]">
            <div className="whitespace-pre-wrap p-2 font-body text-sm flex-1 break-words">
              {note?.text || <p className="text-muted-foreground italic">No note yet.</p>}
            </div>
            {note?.lastUpdated && (
                <p className="self-end px-2 text-xs text-muted-foreground">
                    Last updated: {note.lastUpdated}
                </p>
            )}
          </div>
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
  notes: Note[];
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

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

  const noteDates = useMemo(() => notes.map(note => new Date(note.date.replace(/-/g, '/'))), [notes]);

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
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth} disabled={isSameMonth(new Date(), currentDate)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className="text-center text-xs font-medium text-muted-foreground">
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
  const { user: currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dailyNotes = useMemo(() => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return notes.filter(n => n.date === dateString);
  }, [notes, selectedDate]);

  
  const handleSaveNote = (userToSave: User) => (text: string) => {
    if (!currentUser) return;
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const noteId = `${dateKey}-${userToSave}`;
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    setNotes(prevNotes => {
      const existingNoteIndex = prevNotes.findIndex(n => n.id === noteId);
      
      if (existingNoteIndex > -1) {
        // Update existing note
        return prevNotes.map((note, index) => 
          index === existingNoteIndex ? { ...note, text, lastUpdated: now } : note
        );
      } else {
        // Add new note
        const newNote: Note = {
          id: noteId,
          author: userToSave,
          date: dateKey,
          text,
          lastUpdated: now,
        };
        return [...prevNotes, newNote];
      }
    });
  };

  if (!currentUser) return null;

  const otherUser = currentUser === 'Him' ? 'Her' : 'Him';
  
  const canEditSelectedDate = isToday(selectedDate);
  
  const currentUserNote = dailyNotes.find(n => n.author === currentUser);
  const otherUserNote = dailyNotes.find(n => n.author === otherUser);

  return (
    <div className="flex h-full flex-col p-4 md:flex-row md:gap-8 md:p-8">
      <div className="flex w-full flex-col items-center gap-4 md:w-72 md:flex-shrink-0">
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 mt-4 md:mt-0">
        <h2 className="text-xl font-headline text-primary">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h2>
        <div className="grid flex-1 items-start gap-4 md:grid-cols-2">
          <NoteEditor
            noteUser={currentUser}
            currentUser={currentUser}
            note={currentUserNote}
            onSave={handleSaveNote(currentUser)}
            colorClass="bg-card text-card-foreground"
            canEdit={canEditSelectedDate}
            selectedDate={selectedDate}
          />
          <NoteEditor
            noteUser={otherUser}
            currentUser={currentUser}
            note={otherUserNote}
            onSave={handleSaveNote(otherUser)}
            colorClass="bg-accent text-accent-foreground"
            canEdit={false} // Only the current user can edit their own note
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
