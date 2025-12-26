'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LoginForm from '@/components/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/chat');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-80" />
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
