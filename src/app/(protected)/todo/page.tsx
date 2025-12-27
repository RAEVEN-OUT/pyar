
'use client';

import { useState, useEffect } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfToday } from 'date-fns';

export type Task = {
  id: number;
  text: string;
  completedAt: string | null;
  createdBy: User;
  createdAt: string;
};

const initialTasks: Task[] = [
  { id: 1, text: 'Book that restaurant for Friday night', completedAt: null, createdBy: 'Her', createdAt: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 2, text: 'Pick up dry cleaning', completedAt: null, createdBy: 'Him', createdAt: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 3, text: 'Plan our next weekend trip', completedAt: '2024-07-24', createdBy: 'Her', createdAt: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy') },
  { id: 4, text: 'Get a gift for my mom\'s birthday', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
  { id: 5, text: 'muahh', completedAt: null, createdBy: 'Him', createdAt: format(new Date(), 'dd/MM/yyyy') },
];


export default function TodoPage() {
  const { user } = useAuth();
  const [newTaskText, setNewTaskText] = useState('');
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !user) return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completedAt: null,
      createdBy: user,
      createdAt: format(new Date(), 'dd/MM/yyyy'),
    };

    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText('');
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
  
  if (!user || !tasks) return null;

  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl bg-[#ffc4c4]">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <ListChecks className="h-8 w-8 text-primary" />
            Our To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="h-11"
            />
            <Button type="submit" size="icon" className="h-11 w-11 flex-shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </form>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map(task => {
                const isCompleted = !!task.completedAt;
                return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg p-3 transition-colors',
                     task.createdBy === 'Him'
                      ? 'bg-card text-primary'
                      : 'bg-accent text-accent-foreground',
                    isCompleted ? 'opacity-60' : 'opacity-100'
                  )}
                >
                  {task.createdBy === user ? (
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleTask && handleToggleTask(task.id)}
                      className={cn(
                          "h-5 w-5",
                          task.createdBy === 'Him' 
                            ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                            : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
                      )}
                    />
                  ) : (
                    <div className="h-5 w-5 flex-shrink-0"></div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <label
                      htmlFor={`task-${task.id}`}
                      className={cn(
                        'text-sm font-medium break-words',
                        isCompleted && 'line-through'
                      )}
                    >
                      {task.text}
                    </label>
                     <p className={cn(
                        'text-xs mt-1',
                         task.createdBy === 'Him' ? 'text-primary/70' : 'text-accent-foreground/70',
                         isCompleted && 'line-through'
                      )}>
                      {task.createdAt}
                    </p>
                  </div>
                </div>
              )})
            ) : (
              <p className="text-center text-muted-foreground pt-4">
                Nothing to do! Add a task to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
