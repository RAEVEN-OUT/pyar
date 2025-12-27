
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfToday } from 'date-fns';
import { useFirebase, useCollection } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';

export type Task = {
  id: string;
  text: string;
  completedAt: string | null;
  assigneeId: string; // The UID of the user who is assigned the task
  creatorRole: User; // 'Him' or 'Her'
  createdAt: any;
};

export default function TodoPage() {
  const { user: currentUserRole } = useAuth();
  const { firestore, user: firebaseUser } = useFirebase();
  const [newTaskText, setNewTaskText] = useState('');

  const tasksQuery = useMemo(() => 
    query(collection(firestore, 'todo_tasks'), orderBy('createdAt', 'desc')), 
    [firestore]
  );
  const { data: tasks } = useCollection<Task>(tasksQuery);
  
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (tasks) {
      const today = startOfToday();
      const filteredTasks = tasks.filter(task => {
        if (!task.completedAt) {
          return true; 
        }
        const completedDate = new Date(task.completedAt);
        return !isBefore(completedDate, today);
      });
      setVisibleTasks(filteredTasks);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !firebaseUser || !currentUserRole) return;

    const newTask = {
      text: newTaskText.trim(),
      completedAt: null,
      assigneeId: firebaseUser.uid,
      creatorRole: currentUserRole,
      createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(collection(firestore, 'todo_tasks'), newTask);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    const taskRef = doc(firestore, 'todo_tasks', taskId);
    updateDocumentNonBlocking(taskRef, {
      completedAt: task.completedAt ? null : new Date().toISOString().split('T')[0],
    });
  };
  
  if (!currentUserRole || !firebaseUser) return null;

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
                const canToggle = task.assigneeId === firebaseUser.uid;
                return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg p-3 transition-colors',
                     task.creatorRole === 'Him'
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
                          task.creatorRole === 'Him' 
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
                         task.creatorRole === 'Him' ? 'text-primary/70' : 'text-accent-foreground/70',
                         isCompleted && 'line-through'
                      )}>
                      {task.createdAt?.toDate().toLocaleDateString()}
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

    