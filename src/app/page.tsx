'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/context/auth-context';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

import { Heart, KeyRound } from 'lucide-react';

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
      setError(err.message || 'Login failed. Please try again.');
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
    <main
      className="
        relative min-h-screen w-full flex items-center justify-center p-4
        bg-[url('/login-mobile.jpg')]
        md:bg-[url('/login-web.jpg')]
        bg-cover bg-center
      "
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Login Card */}
      <Card
        className="
    relative z-10 w-full max-w-sm shadow-xl
    bg-white/80 backdrop-blur-md
    md:bg-background md:backdrop-blur-none
  "
      >

        <CardHeader className="items-center text-center space-y-2">
          <Logo />
          <CardDescription className="text-muted-foreground">
            A private space, just for us.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* User Selection */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={() => setSelectedUser('Raveen')}
                className={cn(
                  'h-12 text-lg transition-colors',

                  // Mobile (default)
                  selectedUser === 'Raveen'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/70 text-foreground',

                  // Web overrides
                  'md:bg-input md:text-foreground',
                  selectedUser === 'Raveen' &&
                  'md:bg-primary md:text-primary-foreground'
                )}
              >
                Raveen
              </Button>


              <Button
                type="button"
                onClick={() => setSelectedUser('Priya')}
                className={cn(
                  'h-12 text-lg transition-colors',

                  // Mobile (default)
                  selectedUser === 'Priya'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/70 text-foreground',

                  // Web overrides
                  'md:bg-input md:text-foreground',
                  selectedUser === 'Priya' &&
                  'md:bg-primary md:text-primary-foreground'
                )}
              >
                Priya
              </Button>

            </div>

            {/* Magic Word */}
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
                  className="
    pl-10
    bg-white/70
    md:bg-input
    border-border
    focus-visible:ring-primary
  "
                />

              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-medium text-destructive text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading || !selectedUser || !magicWord}
            >
              {loading ? 'Entering...' : 'Enter'}
              <Heart className="ml-2 h-5 w-5 fill-current" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            I chose you. I choose you. Always.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
