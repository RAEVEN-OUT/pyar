
'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { useAuth, type User } from './auth-context';

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

const mockActivities: Activity[] = [
    { id: '1', label: 'Workout', checks: { Raveen: true, Priya: false }, creatorId: 'raveen' },
    { id: '2', label: 'Read 30 mins', checks: { Raveen: true, Priya: true }, creatorId: 'raveen' },
    { id: '3', label: 'Journal', checks: { Priya: true, Raveen: false }, creatorId: 'priya' },
];


export function DisciplineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  const addActivity = useCallback((label: string) => {
    if (!user) return;
    const newActivity: Activity = {
      id: new Date().toISOString(),
      label,
      checks: {},
      creatorId: user.toLowerCase(),
    };
    setActivities(prev => [...prev, newActivity]);
  }, [user]);

  const toggleActivity = useCallback((activityId: string, userToToggle: User) => {
    setActivities(prev => 
      prev.map(activity => {
        if (activity.id === activityId) {
          const newChecks = { ...activity.checks };
          newChecks[userToToggle] = !newChecks[userToToggle];
          return { ...activity, checks: newChecks };
        }
        return activity;
      })
    );
  }, []);
  
  const deleteActivity = useCallback((activityId: string) => {
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
