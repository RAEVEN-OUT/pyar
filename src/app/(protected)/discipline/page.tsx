
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { useDiscipline, type Activity } from '@/context/discipline-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Award, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type UserColumnProps = {
  displayedUser: User;
  currentUser: User;
  activities: Activity[];
  score: number;
  newActivity: string;
  onCheckChange: (user: User, activityId: number, currentState: boolean) => void;
  onDeleteActivity: (activityId: number) => void;
  onAddActivity: (e: React.FormEvent) => void;
  onNewActivityChange: (value: string) => void;
};

const UserColumn = ({ 
  displayedUser, 
  currentUser, 
  activities,
  score,
  newActivity,
  onCheckChange,
  onDeleteActivity,
  onAddActivity,
  onNewActivityChange,
}: UserColumnProps) => {
    const isCurrentUser = displayedUser === currentUser;
    const userColorClass = displayedUser === 'Raveen' ? 'bg-card text-card-foreground' : 'bg-accent text-accent-foreground';
    
    return (
       <Card className={cn("w-full flex flex-col", userColorClass)}>
          <CardHeader className="items-center text-center">
             <Avatar className="h-16 w-16 mb-2 border-2">
                <AvatarFallback className={cn("text-3xl", userColorClass, isCurrentUser ? 'border-primary' : 'border-accent-foreground')}>
                  {displayedUser.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
               {displayedUser}
            </CardTitle>
            <p className="flex items-center gap-2 text-lg font-bold">
              <Award className="h-5 w-5" />
              {score} Points
            </p>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {activities.map((activity) => (
              <div
                key={`${displayedUser}-${activity.id}`}
                className={cn(
                  'flex items-center gap-4 rounded-lg p-3 transition-colors group overflow-hidden',
                  'bg-background/50'
                )}
              >
                {isCurrentUser ? (
                  <Checkbox
                    id={`${displayedUser}-${activity.id}`}
                    checked={!!activity.checks[displayedUser]}
                    onCheckedChange={(isChecked) => onCheckChange(displayedUser, activity.id, !!isChecked)}
                    className={cn(
                        "h-6 w-6",
                        displayedUser === 'Raveen' 
                          ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                          : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
                    )}
                  />
                ) : (
                  <div className={cn(
                      "h-6 w-6 flex-shrink-0 border-2 rounded-sm",
                       activity.checks[displayedUser] ? (displayedUser === 'Raveen' ? 'bg-primary border-primary' : 'bg-accent-foreground border-accent-foreground') : 'border-muted-foreground/50'
                    )}
                  />
                )}
                <label
                  htmlFor={`${displayedUser}-${activity.id}`}
                  className={cn(
                    'text-base font-medium flex-1 break-all',
                     displayedUser === 'Raveen' ? 'text-card-foreground' : 'text-accent-foreground',
                    activity.checks[displayedUser] && 'line-through text-muted-foreground'
                  )}
                >
                  {activity.label}
                </label>
                {isCurrentUser && (
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteActivity(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
          {isCurrentUser && (
            <CardFooter>
              <form onSubmit={onAddActivity} className="flex gap-2 w-full">
                <Input
                  type="text"
                  placeholder="New daily activity..."
                  value={newActivity}
                  onChange={(e) => onNewActivityChange(e.target.value)}
                  className="h-10 bg-background/50"
                />
                <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Plus className="h-5 w-5" />
                </Button>
              </form>
            </CardFooter>
          )}
        </Card>
    );
  };

export default function DisciplinePage() {
  const { user: currentUserRole } = useAuth();
  const { activities, addActivity, toggleActivity, deleteActivity } = useDiscipline();
  const { toast } = useToast();
  const [newActivity, setNewActivity] = useState('');
  
  const prevActivitiesRef = useRef<Activity[]>();
  
  const otherUser = currentUserRole === 'Raveen' ? 'Priya' : 'Raveen';

  useEffect(() => {
    if (!activities || !prevActivitiesRef.current || !currentUserRole) {
      prevActivitiesRef.current = activities;
      return;
    }

    const prevOtherUserScore = prevActivitiesRef.current
        .map(a => a.checks[otherUser] ? 1 : 0)
        .reduce((sum, current) => sum + current, 0);
    
    const currentOtherUserScore = activities
        .map(a => a.checks[otherUser] ? 1 : 0)
        .reduce((sum, current) => sum + current, 0);

    if (currentOtherUserScore > prevOtherUserScore) {
      const completedActivity = activities.find(act => {
        const prevAct = prevActivitiesRef.current?.find(p => p.id === act.id);
        return act.checks[otherUser] && !prevAct?.checks[otherUser];
      });
      if (completedActivity) {
        toast({
          title: `${otherUser} completed a task! 🎉`,
          description: `${otherUser === 'Priya' ? 'She' : 'He'} finished '${completedActivity.label}'. Way to go!`,
        });
      }
    }
    prevActivitiesRef.current = activities;
  }, [activities, currentUserRole, otherUser, toast]);


  if (!currentUserRole) {
    return null; // Or a loading spinner
  }

  const handleCheckChange = (checkedUser: User, activityId: number) => {
    toggleActivity(activityId, checkedUser);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.trim() === '') return;
    
    addActivity(newActivity.trim());
    setNewActivity('');
  };
  
  const userScore = activities.filter(a => a.checks[currentUserRole]).length;
  const otherUserScore = activities.filter(a => a.checks[otherUser]).length;

  const userActivities = activities;
  const otherUserActivities = activities;

  // Determine which user is displayed on the left and which is on the right
  const leftUser = currentUserRole === 'Raveen' ? 'Raveen' : 'Priya';
  const rightUser = currentUserRole === 'Raveen' ? 'Priya' : 'Raveen';
  
  return (
    <div className="flex h-full flex-col items-center justify-center p-4 md:p-8">
       <div className="flex w-full max-w-4xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-3xl font-headline text-primary self-center mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Discipline Tracker
          </div>
          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <UserColumn 
              displayedUser={leftUser}
              currentUser={currentUserRole}
              activities={userActivities}
              score={leftUser === currentUserRole ? userScore : otherUserScore}
              newActivity={newActivity}
              onCheckChange={handleCheckChange}
              onDeleteActivity={deleteActivity}
              onAddActivity={handleAddActivity}
              onNewActivityChange={setNewActivity}
            />
            <UserColumn 
              displayedUser={rightUser}
              currentUser={currentUserRole}
              activities={otherUserActivities}
              score={rightUser === currentUserRole ? userScore : otherUserScore}
              newActivity={''} // Not used for other user
              onCheckChange={() => {}} // Not used
              onDeleteActivity={() => {}} // Not used
              onAddActivity={() => {}} // Not used
              onNewActivityChange={() => {}} // Not used
            />
          </div>
        </div>
    </div>
  );
}
