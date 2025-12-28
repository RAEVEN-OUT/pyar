// src/components/chat/MoodDisplay.tsx
'use client';

import { useState, useEffect } from 'react';
import { type User } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';

type Mood = {
  mood: string;
  emoji: string;
};

const moodOptions: Mood[] = [
  { mood: 'Happy', emoji: '😊' },
  { mood: 'Missing you', emoji: '🥺' },
  { mood: 'Love u', emoji: '🥰' },
  { mood: 'Freaky', emoji: '😝' },
  { mood: 'Low', emoji: '😔' },
  { mood: 'Ehhh', emoji: '😅' },
  { mood: 'Angry', emoji: '😠' },
  { mood: 'Tired', emoji: '😴' },
];

interface MoodDisplayProps {
  user: User;
  otherUser: User;
}

export function MoodDisplay({ user, otherUser }: MoodDisplayProps) {
  const [currentUserMood, setCurrentUserMood] = useState<Mood>(moodOptions[0]);
  const [otherUserMood, setOtherUserMood] = useState<Mood>(moodOptions[1]);

  useEffect(() => {
    const moodsRef = collection(db, 'moods');
    const unsubscribe = onSnapshot(moodsRef, snapshot => {
      snapshot.docs.forEach(d => {
        const data = d.data() as { emoji?: string; mood?: string };
        if (d.id === user.toLowerCase()) {
          const mood = moodOptions.find(m => m.emoji === data.emoji) || moodOptions[0];
          setCurrentUserMood(mood);
        } else if (d.id === otherUser.toLowerCase()) {
          const mood = moodOptions.find(m => m.emoji === data.emoji) || moodOptions[1];
          setOtherUserMood(mood);
        }
      });
    });

    return () => unsubscribe();
  }, [user, otherUser]);

  const onMoodChange = async (newMood: Mood) => {
    setCurrentUserMood(newMood);
    try {
      const moodRef = doc(db, 'moods', user.toLowerCase());
      await setDoc(
        moodRef,
        {
          emoji: newMood.emoji,
          mood: newMood.mood,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  return (
    <div className="flex justify-between items-center p-4 border-b bg-card rounded-t-lg flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{otherUserMood.emoji}</span>
        <div>
          <p className="font-semibold text-sm">{otherUser}</p>
          <p className="text-xs text-muted-foreground">{otherUserMood.mood}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 text-right cursor-pointer rounded-md p-2 hover:bg-muted transition-colors">
            <div className="flex flex-col items-end">
              <p className="font-semibold text-sm">{user}</p>
              <p className="text-xs text-muted-foreground">{currentUserMood.mood}</p>
            </div>
            <span className="text-4xl">{currentUserMood.emoji}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {moodOptions.map((mood) => (
            <DropdownMenuItem key={mood.mood} onSelect={() => onMoodChange(mood)}>
              <span className="mr-2 text-lg">{mood.emoji}</span>
              <span>{mood.mood}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}