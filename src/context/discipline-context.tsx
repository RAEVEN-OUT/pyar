
'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback
} from 'react';
import { type User } from './auth-context';

export type Activity = {
  id: number;
  label: string;
  checks: {
    [key in User]?: boolean;
  };
};

const initialActivities: Activity[] = [
  { id: 1, label: 'Workout', checks: { Raveen: true, Priya: false } },
  { id: 2, label: 'Read 10 pages', checks: { Raveen: false, Priya: true } },
  { id: 3, label: 'No social media after 10 PM', checks: { Raveen: true, Priya: true } },
];

interface DisciplineContextType {
  activities: Activity[];
  addActivity: (label: string) => void;
  toggleActivity: (activityId: number, user: User) => void;
  deleteActivity: (activityId: number) => void;
}

const DisciplineContext = createContext<DisciplineContextType | undefined>(undefined);

export function DisciplineProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = useCallback((label: string) => {
    const newActivity: Activity = {
      id: Date.now(),
      label,
      checks: {},
    };
    setActivities(prev => [...prev, newActivity]);
  }, []);

  const toggleActivity = useCallback((activityId: number, user: User) => {
    setActivities(prev =>
      prev.map(activity => {
        if (activity.id === activityId) {
          const newChecks = { ...activity.checks };
          newChecks[user] = !newChecks[user];
          return { ...activity, checks: newChecks };
        }
        return activity;
      })
    );
  }, []);
  
  const deleteActivity = useCallback((activityId: number) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
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
