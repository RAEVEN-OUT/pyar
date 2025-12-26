'use client';

import { useState, useEffect } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/context/task-context';

export default function TodoPage() {
  const { user } = useAuth();
  const [newTaskText, setNewTaskText] = useState('');
  const { tasks, handleAddTask, handleToggleTask } = useTasks();

  const onAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleAddTask) return;
    handleAddTask(newTaskText);
    setNewTaskText('');
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
          <form onSubmit={onAddTask} className="flex gap-2 mb-6">
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
