
'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback
} from 'react';
import { type User } from './auth-context';
import { format } from 'date-fns';

export type Task = {
  id: number;
  text: string;
  completedAt: string | null; // Date string 'yyyy-MM-dd'
  assignee: User;
  creator: User;
  createdAt: string; // Date string 'yyyy-MM-dd'
};

const initialTasks: Task[] = [
    { id: 1, text: 'Buy groceries for dinner', completedAt: null, assignee: 'Priya', creator: 'Raveen', createdAt: format(new Date(), 'yyyy-MM-dd') },
    { id: 2, text: 'Book flights for vacation', completedAt: '2024-05-20', assignee: 'Raveen', creator: 'Raveen', createdAt: '2024-05-18' },
    { id: 3, text: 'Call the plumber about the leaky faucet', completedAt: null, assignee: 'Raveen', creator: 'Priya', createdAt: format(new Date(), 'yyyy-MM-dd') },
];

interface TasksContextType {
  tasks: Task[];
  addTask: (text: string, currentUser: User) => void;
  toggleTask: (taskId: number) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = useCallback((text: string, currentUser: User) => {
    const newTask: Task = {
      id: Date.now(),
      text: text,
      completedAt: null,
      assignee: currentUser, // By default, assign to self
      creator: currentUser,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((taskId: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              completedAt: task.completedAt ? null : format(new Date(), 'yyyy-MM-dd'),
            }
          : task
      )
    );
  }, []);

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

    