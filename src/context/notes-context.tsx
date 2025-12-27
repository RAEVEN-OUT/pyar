
'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useAuth, type User } from './auth-context';
import { format } from 'date-fns';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

export function NotesProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  
  const notesCollectionRef = useMemoFirebase(() => user ? collection(firestore, 'userProfiles', user, 'notes') : null, [firestore, user]);
  const { data: notes } = useCollection<Note>(notesCollectionRef);

  const saveNote = useCallback((author: User, date: Date, text: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const noteRef = doc(firestore, 'userProfiles', author, 'notes', dateKey);

    setDoc(noteRef, {
      id: dateKey,
      author,
      text,
      lastUpdated: serverTimestamp(),
    }, { merge: true });

  }, [firestore]);
  
  const value = { notes: notes || [], saveNote };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
