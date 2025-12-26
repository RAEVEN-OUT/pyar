
'use client';

import { useState } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Task = {
  id: number;
  text: string;
  completed: boolean;
  createdBy: User;
};

const initialTasks: Task[] = [
  { id: 1, text: 'Book that restaurant for Friday night', completed: false, createdBy: 'Her' },
  { id: 2, text: 'Pick up dry cleaning', completed: false, createdBy: 'Him' },
  { id: 3, text: 'Plan our next weekend trip', completed: true, createdBy: 'Her' },
  { id: 4, text: 'Get a gift for my mom\'s birthday', completed: false, createdBy: 'Him' },
  { id: 5, text: 'muahh', completed: false, createdBy: 'Him' },
];

export default function TodoPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !user) return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      createdBy: user,
    };

    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: number) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  if (!user) return null;

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
              tasks.map(task => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg p-3 transition-colors',
                    task.createdBy === 'Him'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border-r-[6px] border-accent',
                    task.completed ? 'opacity-60' : 'opacity-100'
                  )}
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    className={cn(
                        "h-5 w-5",
                        task.createdBy === 'Him' && 'border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary'
                    )}
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      'flex-1 text-sm font-medium cursor-pointer',
                      task.completed && 'line-through'
                    )}
                  >
                    {task.text}
                  </label>
                </div>
              ))
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
