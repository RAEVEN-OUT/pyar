
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Award, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Activity = {
  id: string;
  label: string;
  checks: {
    [key in User]?: boolean;
  };
};

type UserColumnProps = {
  displayedUser: User;
  currentUser: User;
  activities: Activity[];
  score: number;
  newActivity: string;
  onCheckChange: (user: User, activityId: string, currentState: boolean) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddActivity: (e: React.FormEvent) => void;
  onNewActivityChange: (value: string) => void;
};

const initialActivities: Activity[] = [
  { id: '1', label: 'Workout', checks: { Him: true, Her: false } },
  { id: '2', label: 'Read for 30 mins', checks: { Him: false, Her: true } },
  { id: '3', label: 'No social media after 10 PM', checks: { Him: true, Her: true } },
];


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
    const userColorClass = displayedUser === 'Him' ? 'bg-card text-primary' : 'bg-accent text-accent-foreground';
    
    return (
       <Card className={cn("w-full flex flex-col", userColorClass)}>
          <CardHeader className="items-center text-center">
             <Avatar className="h-16 w-16 mb-2 border-2">
                <AvatarFallback className={cn("text-3xl", userColorClass, isCurrentUser ? 'border-primary' : 'border-accent')}>
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
                  isCurrentUser ? 'bg-background/50' : 'bg-background/20'
                )}
              >
                {isCurrentUser ? (
                  <Checkbox
                    id={`${displayedUser}-${activity.id}`}
                    checked={!!activity.checks[displayedUser]}
                    onCheckedChange={(isChecked) => onCheckChange(displayedUser, activity.id, !!isChecked)}
                    className={cn(
                        "h-6 w-6",
                        displayedUser === 'Him' 
                          ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                          : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
                    )}
                  />
                ) : (
                  <div className="h-6 w-6 flex-shrink-0" />
                )}
                <label
                  htmlFor={`${displayedUser}-${activity.id}`}
                  className={cn(
                    'text-base font-medium flex-1 break-all',
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
                  placeholder="New activity..."
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [newActivity, setNewActivity] = useState('');
  
  const prevActivitiesRef = useRef<Activity[]>();
  const otherUser = user === 'Him' ? 'Her' : 'Him';

  useEffect(() => {
    if (!activities || !prevActivitiesRef.current || !user || !otherUser) {
      prevActivitiesRef.current = activities || [];
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
          description: `${otherUser === 'Her' ? 'She' : 'He'} finished '${completedActivity.label}'. Way to go!`,
        });
      }
    }
    prevActivitiesRef.current = activities;
  }, [activities, user, otherUser, toast]);


  if (!user) {
    return null;
  }

  const handleCheckChange = (checkedUser: User, activityId: string, isChecked: boolean) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? {
              ...act,
              checks: { ...act.checks, [checkedUser]: isChecked },
            }
          : act
      )
    );
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.trim() === '' || !user) return;
    
    const newActivityData: Activity = {
      id: crypto.randomUUID(),
      label: newActivity.trim(),
      checks: { Him: false, Her: false },
    };
    
    setActivities((prev) => [...prev, newActivityData]);
    setNewActivity('');
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(act => act.id !== activityId));
  };
  
  const userScore = activities.filter(a => a.checks[user]).length;
  const otherUserScore = activities.filter(a => a.checks[otherUser]).length;

  const userActivities = activities;
  const otherUserActivities = activities;
  
  return (
    <div className="flex h-full flex-col items-center justify-center p-4 md:p-8">
       <div className="flex w-full max-w-4xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-3xl font-headline text-primary self-center mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Discipline Tracker
          </div>
          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <UserColumn 
              displayedUser={user}
              currentUser={user}
              activities={userActivities}
              score={userScore}
              newActivity={newActivity}
              onCheckChange={handleCheckChange}
              onDeleteActivity={handleDeleteActivity}
              onAddActivity={handleAddActivity}
              onNewActivityChange={setNewActivity}
            />
            <UserColumn 
              displayedUser={otherUser}
              currentUser={user}
              activities={otherUserActivities}
              score={otherUserScore}
              newActivity={newActivity} // These are passed but the component won't render the inputs
              onCheckChange={handleCheckChange}
              onDeleteActivity={handleDeleteActivity}
              onAddActivity={handleAddActivity}
              onNewActivityChange={setNewActivity}
            />
          </div>
        </div>
    </div>
  );
}
