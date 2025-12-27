
'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { type User } from './auth-context';
import { format } from 'date-fns';

export type Note = {
  id: string; // "yyyy-MM-dd"
  author: User;
  text: string;
  lastUpdated: any;
};

interface NotesContextType {
  notes: Note[];
  saveNote: (author: User, date: Date, text: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const mockNotes: Note[] = [
    { id: format(new Date(), 'yyyy-MM-dd'), author: 'Raveen', text: 'Feeling great today!', lastUpdated: { seconds: Date.now() / 1000 } },
    { id: format(new Date(), 'yyyy-MM-dd'), author: 'Priya', text: 'Excited for the weekend! 💕', lastUpdated: { seconds: Date.now() / 1000 } },
];


export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(mockNotes);

  const saveNote = useCallback((author: User, date: Date, text: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    setNotes(prev => {
        const existingNoteIndex = prev.findIndex(n => n.id === dateKey && n.author === author);
        const newNote: Note = {
            id: dateKey,
            author,
            text,
            lastUpdated: { seconds: Date.now() / 1000 },
        };
        
        if (existingNoteIndex > -1) {
            const newNotes = [...prev];
            newNotes[existingNoteIndex] = newNote;
            return newNotes;
        } else {
            return [...prev, newNote];
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
