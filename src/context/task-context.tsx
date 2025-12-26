'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { format, isBefore, startOfToday } from 'date-fns';
import { type User, useAuth } from './auth-context';

export type Task = {
  id: number;
  text: string;
  completedAt: string | null;
  createdBy: User;
  createdAt: string;
};

interface TaskContextType {
  tasks: Task[];
  handleAddTask: (text: string) => void;
  handleToggleTask: (id: number) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialTasks: Task[] = [
  { id: 1, text: 'Book that restaurant for Friday night', completedAt: null, createdBy: 'Her', createdAt: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 2, text: 'Pick up dry cleaning', completedAt: null, createdBy: 'Him', createdAt: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 3, text: 'Plan our next weekend trip', completedAt: '2024-07-24', createdBy: 'Her', createdAt: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 4, text: 'Get a gift for my mom\'s birthday', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
  { id: 5, text: 'muahh', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    const today = startOfToday();
    setTasks(currentTasks =>
      currentTasks.filter(task => {
        if (!task.completedAt) {
          return true; 
        }
        const completedDate = new Date(task.completedAt);
        return !isBefore(completedDate, today);
      })
    );
  }, []);

  const handleAddTask = (newTaskText: string) => {
    if (!newTaskText.trim() || !user) return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completedAt: null,
      createdBy: user,
      createdAt: format(new Date(), 'dd/MM/yyyy'),
    };

    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleToggleTask = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completedAt: task.completedAt ? null : new Date().toISOString().split('T')[0],
        };
      }
      return task;
    }));
  };

  const value = { tasks, handleAddTask, handleToggleTask };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
