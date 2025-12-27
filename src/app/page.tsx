
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LoginForm from '@/components/login-form';
import { Heart } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth state is not loading and a user is found, redirect them.
    if (!loading && user) {
      router.replace('/chat');
    }
  }, [user, loading, router]);

  // While checking auth, or if the user is logged in and we are redirecting,
  // show the main app loader.
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Heart className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  // If not loading and no user, show the login form.
  return <LoginForm />;
}
