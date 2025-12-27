
'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useMemo
} from 'react';
import { useAuth, type User } from './auth-context';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export type Activity = {
  id: string;
  label: string;
  checks: {
    [key in User]?: boolean;
  };
  creatorId: string;
};

interface DisciplineContextType {
  activities: Activity[];
  addActivity: (label: string) => void;
  toggleActivity: (activityId: string, user: User) => void;
  deleteActivity: (activityId: string) => void;
}

const DisciplineContext = createContext<DisciplineContextType | undefined>(undefined);

export function DisciplineProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { firebaseUser } = useAuth();

  const activitiesCollectionRef = useMemoFirebase(() => collection(firestore, 'disciplineActivities'), [firestore]);
  const { data: activities } = useCollection<Activity>(activitiesCollectionRef);

  const addActivity = useCallback((label: string) => {
    if (!firebaseUser) return;
    addDoc(activitiesCollectionRef, {
      label,
      checks: {},
      creatorId: firebaseUser.uid,
    });
  }, [activitiesCollectionRef, firebaseUser]);

  const toggleActivity = useCallback((activityId: string, user: User) => {
    const activity = activities?.find(a => a.id === activityId);
    if (!activity) return;
    const activityRef = doc(firestore, 'disciplineActivities', activityId);
    
    const newChecks = { ...activity.checks };
    newChecks[user] = !newChecks[user];

    updateDoc(activityRef, { checks: newChecks });
  }, [activities, firestore]);
  
  const deleteActivity = useCallback((activityId: string) => {
    const activityRef = doc(firestore, 'disciplineActivities', activityId);
    deleteDoc(activityRef);
  }, [firestore]);


  const value = { activities: activities || [], addActivity, toggleActivity, deleteActivity };

  return <DisciplineContext.Provider value={value}>{children}</DisciplineContext.Provider>;
}

export function useDiscipline() {
  const context = useContext(DisciplineContext);
  if (context === undefined) {
    throw new Error('useDiscipline must be used within a DisciplineProvider');
  }
  return context;
}
