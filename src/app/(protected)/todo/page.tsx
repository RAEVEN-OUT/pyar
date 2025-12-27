
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfToday } from 'date-fns';
import { useTasks, type Task } from '@/context/todo-context';


export default function TodoPage() {
  const { user: currentUserRole } = useAuth();
  const { tasks, addTask, toggleTask } = useTasks();
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
    addTask(newTaskText.trim(), currentUserRole);
    setNewTaskText('');
  };

  if (!currentUserRole) return null;

  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl bg-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline text-primary">
            <ListChecks className="h-8 w-8" />
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
              className="h-11 bg-background"
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
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card text-card-foreground',
                    isCompleted ? 'opacity-60' : 'opacity-100'
                  )}
                >
                  {canToggle ? (
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={isCompleted}
                      onCheckedChange={() => toggleTask(task.id)}
                      className={cn(
                          "h-5 w-5",
                          task.assignee === 'Him' 
                            ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                            : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
                      )}
                    />
                  ) : (
                     <div className={cn(
                      "h-5 w-5 flex-shrink-0 border-2 rounded-sm",
                       task.completedAt ? (task.assignee === 'Him' ? 'bg-primary border-primary' : 'bg-accent-foreground border-accent-foreground') : 'border-muted-foreground/50'
                    )}
                  />
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
                         task.creator === 'Her' ? 'text-accent-foreground/70' : 'text-card-foreground/70',
                         isCompleted && 'line-through'
                      )}>
                      Created by {task.creator} on {task.createdAt}
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
