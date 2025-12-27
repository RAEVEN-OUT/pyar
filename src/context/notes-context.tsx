'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { type User } from './auth-context';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export type Note = {
  id: string; // "yyyy-MM-dd"
  author: User;
  text: string;
  lastUpdated: Timestamp;
};

interface NotesContextType {
  notes: Note[];
  saveNote: (author: User, date: Date, text: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const notesRef = collection(db, 'notes');
    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      const newNotes: Note[] = [];
      snapshot.forEach((doc) => {
        newNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(newNotes);
    });

    return () => unsubscribe();
  }, []);

  const saveNote = useCallback(async (author: User, date: Date, text: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const noteId = `${dateKey}_${author.toLowerCase()}`;
    
    try {
      const noteRef = doc(db, 'notes', noteId);
      await setDoc(noteRef, {
        id: dateKey,
        author,
        text,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving note:', error);
    }
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