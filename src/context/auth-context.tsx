
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback
} from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export type User = 'Him' | 'Her';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleEmails: Record<User, string> = {
  Him: 'him@amoremduo.app',
  Her: 'her@amoremduo.app',
};

const magicWords: Record<User, string> = {
  Him: '070805',
  Her: '210406',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, isUserLoading } = useFirebase();
  const [userRole, setUserRole] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && auth.currentUser) {
      const email = auth.currentUser.email;
      if (email === roleEmails.Him) {
        setUserRole('Him');
      } else if (email === roleEmails.Her) {
        setUserRole('Her');
      }
    } else if (!isUserLoading) {
      setUserRole(null);
    }
     setLoading(isUserLoading);
  }, [auth, isUserLoading]);

  const login = useCallback(async (selectedUser: User, magicWord: string) => {
    if (magicWord !== magicWords[selectedUser]) {
      throw new Error("That's not the right magic word. Try again.");
    }
    
    const email = roleEmails[selectedUser];

    try {
      await signInWithEmailAndPassword(auth, email, magicWord);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, magicWord);
        } catch (creationError: any) {
           throw new Error('Failed to create account. Please try again.');
        }
      } else {
        throw new Error('An unexpected error occurred during login.');
      }
    }
  }, [auth]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserRole(null);
    router.push('/');
  }, [auth, router]);
  
  const value = { user: userRole, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
