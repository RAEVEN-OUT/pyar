
'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { type User } from './auth-context';
import { format } from 'date-fns';

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

const mockTasks: Task[] = [
    { id: '1', text: 'Buy groceries', completedAt: null, assignee: 'Priya', creator: 'Raveen', createdAt: { seconds: Date.now() / 1000 - 86400 } },
    { id: '2', text: 'Plan weekend trip', completedAt: null, assignee: 'Raveen', creator: 'Raveen', createdAt: { seconds: Date.now() / 1000 - 43200 } },
    { id: '3', text: 'Call parents', completedAt: new Date().toISOString(), assignee: 'Priya', creator: 'Priya', createdAt: { seconds: Date.now() / 1000 - 172800 } },
];


export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const addTask = useCallback((text: string, currentUser: User) => {
    const newTask: Task = {
        id: new Date().toISOString(),
        text,
        completedAt: null,
        assignee: currentUser,
        creator: currentUser,
        createdAt: { seconds: Date.now() / 1000 },
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => 
        prev.map(task => {
            if (task.id === taskId) {
                return { ...task, completedAt: task.completedAt ? null : format(new Date(), 'yyyy-MM-dd') };
            }
            return task;
        })
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
