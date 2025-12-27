
'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback
} from 'react';
import { type User } from './auth-context';
import { format } from 'date-fns';

export type Note = {
  id: string; // "yyyy-MM-dd-Him" or "yyyy-MM-dd-Her"
  author: User;
  date: string; // 'yyyy-MM-dd'
  text: string;
  lastUpdated: string;
};

interface NotesContextType {
  notes: Note[];
  saveNote: (author: User, date: Date, text: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const saveNote = useCallback((author: User, date: Date, text: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const noteId = `${dateKey}-${author}`;
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
          author,
          date: dateKey,
          text,
          lastUpdated: now,
        };
        return [...prevNotes, newNote];
      }
    });
  }, []);

  const value = { notes, saveNote };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
