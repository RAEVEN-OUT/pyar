
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
  completedAt: string | null; // Date string 'yyyy-MM-dd'
  assignee: User;
  creator: User;
  createdAt: string; // Date string 'yyyy-MM-dd'
};

const initialTasks: Task[] = [
    { id: 1, text: 'Buy groceries for dinner', completedAt: null, assignee: 'Her', creator: 'Him', createdAt: format(new Date(), 'yyyy-MM-dd') },
    { id: 2, text: 'Book flights for vacation', completedAt: '2024-05-20', assignee: 'Him', creator: 'Him', createdAt: '2024-05-18' },
    { id: 3, text: 'Call the plumber about the leaky faucet', completedAt: null, assignee: 'Him', creator: 'Her', createdAt: format(new Date(), 'yyyy-MM-dd') },
];


export default function TodoPage() {
  const { user: currentUserRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskText, setNewTaskText] = useState('');
  
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);

  useEffect(() => {
    const today = startOfToday();
    const filteredTasks = tasks.filter(task => {
      if (!task.completedAt) {
        return true; 
      }
      const completedDate = new Date(task.completedAt);
      return !isBefore(completedDate, today);
    });
    setVisibleTasks(filteredTasks.sort((a,b) => b.id - a.id));
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !currentUserRole) return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completedAt: null,
      assignee: currentUserRole,
      creator: currentUserRole,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: number) => {
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
  };
  
  if (!currentUserRole) return null;

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
            {visibleTasks.length > 0 ? (
              visibleTasks.map(task => {
                const isCompleted = !!task.completedAt;
                const canToggle = task.assignee === currentUserRole;
                return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg p-3 transition-colors',
                     task.creator === 'Her'
                      ? 'bg-card text-primary'
                      : 'bg-accent text-accent-foreground',
                    isCompleted ? 'opacity-60' : 'opacity-100'
                  )}
                >
                  {canToggle ? (
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className={cn(
                          "h-5 w-5",
                          task.creator === 'Her' 
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
                         task.creator === 'Her' ? 'text-primary/70' : 'text-accent-foreground/70',
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
