
'use client';

import { useState, useMemo } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { TasksProvider, useTasks, type Task } from '@/context/todo-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListChecks, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { format as formatDate } from 'date-fns';

const TaskItem = ({ task, currentUser, onToggle }: { task: Task, currentUser: User, onToggle: (id: string) => void }) => {
  const isCreatorRaveen = task.creator === 'Raveen';
  const canToggle = task.assignee === currentUser;

  const cardClasses = cn(
    "flex items-center gap-4 rounded-lg p-3 transition-colors",
    isCreatorRaveen
      ? 'bg-card text-card-foreground'
      : 'bg-accent text-accent-foreground'
  );

  const checkboxClasses = cn(
    "h-5 w-5",
    isCreatorRaveen
        ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
        : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
  );
  
   const staticIndicatorClasses = cn(
      "h-5 w-5 flex-shrink-0 border-2 rounded-sm flex items-center justify-center",
       isCreatorRaveen
        ? (task.completedAt ? 'bg-primary border-primary' : 'border-muted-foreground/50')
        : (task.completedAt ? 'bg-accent-foreground border-accent-foreground' : 'border-muted-foreground/50')
    );

  return (
    <div className={cardClasses}>
      {canToggle ? (
        <Checkbox
          id={`task-${task.id}`}
          checked={!!task.completedAt}
          onCheckedChange={() => onToggle(task.id)}
          className={checkboxClasses}
        />
      ) : (
        <div className={staticIndicatorClasses}>
          {task.completedAt && <div className={cn("h-2.5 w-2.5 rounded-sm", isCreatorRaveen ? "bg-card" : "bg-accent")} />}
        </div>
      )}
      <div className="flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className={cn(
            'font-medium break-all',
            task.completedAt && 'line-through text-muted-foreground'
          )}
        >
          {task.text}
        </label>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Created by {task.creator} on {task.createdAt ? formatDate(new Date(task.createdAt.seconds * 1000), 'yyyy-MM-dd') : ''}
        </p>
      </div>
    </div>
  );
};

function ToDoPageContent() {
  const { user: currentUser } = useAuth();
  const { tasks, addTask, toggleTask } = useTasks();
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '' || !currentUser) return;
    addTask(newTaskText, currentUser);
    setNewTaskText('');
  };

  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = tasks.filter(task => !task.completedAt).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    const completed = tasks.filter(task => task.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  if (!currentUser) return null;
  
  const otherUser = currentUser === 'Raveen' ? 'Priya' : 'Raveen';

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline text-primary">
            <ListChecks className="h-8 w-8 text-primary" />
            Our To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-6">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input
              type="text"
              placeholder={`Add a task for yourself or ${otherUser}...`}
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="h-10"
            />
            <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">To-Do</h3>
              {pendingTasks.length > 0 ? (
                pendingTasks.map(task => (
                  <TaskItem key={task.id} task={task} currentUser={currentUser} onToggle={toggleTask} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic text-center py-4">
                  Nothing to do! All tasks are complete.
                </p>
              )}
            </div>

            {completedTasks.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">Completed</h3>
                  {completedTasks.map(task => (
                     <TaskItem key={task.id} task={task} currentUser={currentUser} onToggle={toggleTask} />
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ToDoPage() {
    return (
        <TasksProvider>
            <ToDoPageContent />
        </TasksProvider>
    );
}
