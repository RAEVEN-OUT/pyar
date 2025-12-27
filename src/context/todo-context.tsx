
'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import { useAuth, type User } from './auth-context';
import { format } from 'date-fns';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export type Task = {
  id: string;
  text: string;
  completedAt: string | null;
  assignee: User;
  creator: User;
  createdAt: any;
};

interface TasksContextType {
  tasks: Task[];
  addTask: (text: string, currentUser: User) => void;
  toggleTask: (taskId: string) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const tasksCollectionRef = useMemoFirebase(() => collection(firestore, 'toDoTasks'), [firestore]);
  const { data: tasks } = useCollection<Task>(tasksCollectionRef);

  const addTask = useCallback((text: string, currentUser: User) => {
    addDoc(tasksCollectionRef, {
      text: text,
      completedAt: null,
      assignee: currentUser, // By default, assign to self
      creator: currentUser,
      createdAt: serverTimestamp(),
    });
  }, [tasksCollectionRef]);

  const toggleTask = useCallback((taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    const taskRef = doc(firestore, 'toDoTasks', taskId);
    updateDoc(taskRef, {
      completedAt: task.completedAt ? null : format(new Date(), 'yyyy-MM-dd'),
    });
  }, [tasks, firestore]);

  const value = { tasks: tasks || [], addTask, toggleTask };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
