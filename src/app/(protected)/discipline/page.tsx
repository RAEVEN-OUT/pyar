
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

const initialActivities = [
  { id: 'workout', label: 'Workout' },
  { id: 'read', label: 'Read a book' },
  { id: 'wake-up', label: 'Wake up early' },
  { id: 'no-junk', label: 'No junk food' },
  { id: 'meditate', label: 'Meditate' },
  { id: 'journal', label: 'Journal' },
];

type Activity = {
  id: string;
  label: string;
};

type CheckedState = {
  [key in User]: {
    [activityId: string]: boolean;
  };
};

type UserColumnProps = {
  displayedUser: User;
  currentUser: User;
  activities: Activity[];
  checked: CheckedState;
  score: number;
  newActivity: string;
  onCheckChange: (user: User, activityId: string) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddActivity: (e: React.FormEvent) => void;
  onNewActivityChange: (value: string) => void;
};


const UserColumn = ({ 
  displayedUser, 
  currentUser, 
  activities,
  checked,
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
                    checked={!!checked[displayedUser][activity.id]}
                    onCheckedChange={() => onCheckChange(displayedUser, activity.id)}
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
                    checked[displayedUser][activity.id] && 'line-through text-muted-foreground'
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
  const [checked, setChecked] = useState<CheckedState>({
    Him: {},
    Her: {},
  });
  
  const otherUser = user === 'Him' ? 'Her' : 'Him';
  const prevCheckedRef = useRef<CheckedState>();
  
  if (!user) {
    return null;
  }

  useEffect(() => {
    // Reset daily checks at midnight
    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('disciplineLastReset');
    
    let loadedChecks: CheckedState = { Him: {}, Her: {} };

    if (lastReset !== today) {
      localStorage.setItem('disciplineLastReset', today);
      localStorage.removeItem('disciplineChecks');
    } else {
       // Load persisted checks from localStorage
      const savedChecks = localStorage.getItem('disciplineChecks');
      if (savedChecks) {
          try {
              const parsedChecks = JSON.parse(savedChecks);
              loadedChecks = parsedChecks;
          } catch (e) {
              console.error("Failed to parse discipline checks from localStorage", e);
          }
      }
    }
    setChecked(loadedChecks);
    prevCheckedRef.current = loadedChecks;
  }, []);

  useEffect(() => {
    // Persist checks to localStorage whenever they change
    try {
        localStorage.setItem('disciplineChecks', JSON.stringify(checked));
    } catch (e) {
        console.error("Failed to save discipline checks to localStorage", e);
    }

    if (prevCheckedRef.current && user) {
        const prevOtherUserChecks = prevCheckedRef.current[otherUser] || {};
        const currentOtherUserChecks = checked[otherUser] || {};

        const prevScore = Object.values(prevOtherUserChecks).filter(Boolean).length;
        const currentScore = Object.values(currentOtherUserChecks).filter(Boolean).length;
        
        if (currentScore > prevScore) {
            const completedActivityId = Object.keys(currentOtherUserChecks).find(
                (id) => currentOtherUserChecks[id] && !prevOtherUserChecks[id]
            );

            if (completedActivityId) {
                const activity = activities.find(a => a.id === completedActivityId);
                if (activity) {
                     toast({
                        title: `${otherUser} completed a task! 🎉`,
                        description: `${otherUser === 'Her' ? 'She' : 'He'} finished '${activity.label}'. Way to go!`,
                    });
                }
            }
        }
    }
    prevCheckedRef.current = checked;

  }, [checked, user, otherUser, activities, toast]);


  const handleCheckChange = (checkedUser: User, activityId: string) => {
    if (checkedUser !== user) return;
    setChecked((prev) => ({
      ...prev,
      [checkedUser]: {
        ...prev[checkedUser],
        [activityId]: !prev[checkedUser][activityId],
      },
    }));
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.trim() === '') return;
    const newActivityItem = {
      id: crypto.randomUUID(),
      label: newActivity.trim(),
    };
    setActivities((prev) => [...prev, newActivityItem]);
    setNewActivity('');
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
    setChecked((prev) => {
      const newChecked = { ...prev };
      delete newChecked.Him[activityId];
      delete newChecked.Her[activityId];
      return newChecked;
    });
  };

  const userScore = Object.values(checked[user] || {}).filter(Boolean).length;
  const otherUserScore = Object.values(checked[otherUser] || {}).filter(Boolean).length;
  
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
              activities={activities}
              checked={checked}
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
              activities={activities}
              checked={checked}
              score={otherUserScore}
              newActivity={newActivity}
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
