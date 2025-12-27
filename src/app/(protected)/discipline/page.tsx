
'use client';

import { useState } from 'react';
import { useAuth, type User } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const activities = [
  { id: 'workout', label: 'Workout' },
  { id: 'read', label: 'Read a book' },
  { id: 'wake-up', label: 'Wake up early' },
  { id: 'no-junk', label: 'No junk food' },
  { id: 'meditate', label: 'Meditate' },
  { id: 'journal', label: 'Journal' },
];

type CheckedState = {
  [key in User]: {
    [activityId: string]: boolean;
  };
};

export default function DisciplinePage() {
  const { user } = useAuth();
  const [checked, setChecked] = useState<CheckedState>({
    Him: {},
    Her: {},
  });

  const handleCheckChange = (checkedUser: User, activityId: string) => {
    setChecked((prev) => ({
      ...prev,
      [checkedUser]: {
        ...prev[checkedUser],
        [activityId]: !prev[checkedUser][activityId],
      },
    }));
  };

  if (!user) {
    return null;
  }

  const otherUser = user === 'Him' ? 'Her' : 'Him';

  const userScore = Object.values(checked[user]).filter(Boolean).length;
  const otherUserScore = Object.values(checked[otherUser]).filter(Boolean).length;

  const UserColumn = ({ displayedUser }: { displayedUser: User }) => {
    const isCurrentUser = displayedUser === user;
    const score = isCurrentUser ? userScore : otherUserScore;
    const userColorClass = displayedUser === 'Him' ? 'bg-card text-primary' : 'bg-accent text-accent-foreground';
    
    return (
       <Card className={cn("w-full", userColorClass)}>
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
          <CardContent className="space-y-4">
            {activities.map((activity) => (
              <div
                key={`${displayedUser}-${activity.id}`}
                className={cn(
                  'flex items-center gap-4 rounded-lg p-3 transition-colors',
                  isCurrentUser ? 'bg-background/50' : 'bg-background/20'
                )}
              >
                <Checkbox
                  id={`${displayedUser}-${activity.id}`}
                  checked={!!checked[displayedUser][activity.id]}
                  onCheckedChange={() => handleCheckChange(displayedUser, activity.id)}
                   className={cn(
                      "h-6 w-6",
                      displayedUser === 'Him' 
                        ? 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                        : 'border-accent-foreground data-[state=checked]:bg-accent-foreground data-[state=checked]:text-accent'
                  )}
                />
                <label
                  htmlFor={`${displayedUser}-${activity.id}`}
                  className={cn(
                    'text-base font-medium',
                    checked[displayedUser][activity.id] && 'line-through text-muted-foreground'
                  )}
                >
                  {activity.label}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
    );
  };
  
  return (
    <div className="flex h-full flex-col items-center justify-start p-4 md:p-8">
       <div className="flex w-full max-w-4xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-3xl font-headline text-primary self-center mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Discipline Tracker
          </div>
          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8">
            <UserColumn displayedUser={user} />
            <UserColumn displayedUser={otherUser} />
          </div>
        </div>
    </div>
  );
}
