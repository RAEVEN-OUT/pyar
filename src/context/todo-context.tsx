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
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy 
} from 'firebase/firestore';

export type Task = {
  id: string;
  text: string;
  completedAt: string | null;
  assignee: User;
  creator: User;
  createdAt: Timestamp;
};

interface TasksContextType {
  tasks: Task[];
  addTask: (text: string, currentUser: User) => void;
  toggleTask: (taskId: string) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks: Task[] = [];
      snapshot.forEach((doc) => {
        newTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(newTasks);
    });

    return () => unsubscribe();
  }, []);

  const addTask = useCallback(async (text: string, currentUser: User) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        text,
        completedAt: null,
        assignee: currentUser,
        creator: currentUser,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completedAt: task.completedAt ? null : new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, [tasks]);

  const value = { tasks, addTask, toggleTask };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}