
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Heart, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [magicWord, setMagicWord] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/chat');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select "Raveen" or "Priya".');
      return;
    }
    if (!magicWord) {
      setError('Please enter the magic word.');
      return;
    }
    setError('');
    try {
      await login(selectedUser, magicWord);
    } catch (err: any) {
       setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Heart className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardDescription className="text-muted-foreground pt-2">
            A private space, just for us.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block">Who are you?</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={selectedUser === 'Raveen' ? 'default' : 'outline'}
                  onClick={() => setSelectedUser('Raveen')}
                  className={cn(
                    'h-12 text-lg',
                    selectedUser === 'Raveen' && 'bg-primary text-primary-foreground'
                  )}
                >
                  Raveen
                </Button>
                <Button
                  type="button"
                  variant={selectedUser === 'Priya' ? 'default' : 'outline'}
                  onClick={() => setSelectedUser('Priya')}
                  className={cn(
                    'h-12 text-lg',
                    selectedUser === 'Priya' && 'bg-primary text-primary-foreground'
                  )}
                >
                  Priya
                </Button>
              </div>
            </div>

             <div className="space-y-2">
              <Label htmlFor="magic-word">Magic Word</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="magic-word"
                  type="password"
                  placeholder="Enter the magic word"
                  value={magicWord}
                  onChange={(e) => setMagicWord(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full h-12 text-lg" disabled={loading || !selectedUser || !magicWord}>
              {loading ? 'Entering...' : 'Enter'}
              <Heart className="ml-2 h-5 w-5 fill-current" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Only Mine
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
