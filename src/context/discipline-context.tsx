'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useAuth, type User } from './auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';

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
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const checkAndResetDailies = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastResetDate = localStorage.getItem('disciplineLastReset');

      if (lastResetDate !== today) {
        console.log('New day detected. Resetting daily discipline tasks.');
        const activitiesQuery = query(collection(db, 'activities'));
        const snapshot = await getDocs(activitiesQuery);
        const updates: Promise<void>[] = [];
        snapshot.forEach((doc) => {
          updates.push(updateDoc(doc.ref, { checks: {} }));
        });
        await Promise.all(updates);
        localStorage.setItem('disciplineLastReset', today);
        console.log('Daily discipline tasks reset.');
      }
    };

    checkAndResetDailies();

    const activitiesRef = collection(db, 'activities');
    const q = query(activitiesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities: Activity[] = [];
      snapshot.forEach((doc) => {
        newActivities.push({ id: doc.id, ...doc.data() } as Activity);
      });
      setActivities(newActivities);
    });

    return () => unsubscribe();
  }, []);

  const addActivity = useCallback(async (label: string) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'activities'), {
        label,
        checks: {},
        creatorId: user.toLowerCase(),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }, [user]);

  const toggleActivity = useCallback(async (activityId: string, userToToggle: User) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const newChecks = { ...activity.checks };
    newChecks[userToToggle] = !newChecks[userToToggle];

    try {
      const activityRef = doc(db, 'activities', activityId);
      await updateDoc(activityRef, { checks: newChecks });
    } catch (error) {
      console.error('Error toggling activity:', error);
    }
  }, [activities]);
  
  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      await deleteDoc(doc(db, 'activities', activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  }, []);

  const value = { activities, addActivity, toggleActivity, deleteActivity };

  return <DisciplineContext.Provider value={value}>{children}</DisciplineContext.Provider>;
}

export function useDiscipline() {
  const context = useContext(DisciplineContext);
  if (context === undefined) {
    throw new Error('useDiscipline must be used within a DisciplineProvider');
  }
  return context;
}
