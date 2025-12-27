'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

export type User = 'Him' | 'Her';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleEmails = {
  'Him': 'him@amoremduo.app',
  'Her': 'her@amoremduo.app'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { auth, isUserLoading, user: firebaseUser } = useFirebase();

  useEffect(() => {
    if(!isUserLoading) {
      if (firebaseUser) {
        const role = firebaseUser.email === roleEmails.Him ? 'Him' : 'Her';
        setUser(role);
        localStorage.setItem('amorem-duo-user', role);
      } else {
        setUser(null);
        localStorage.removeItem('amorem-duo-user');
      }
      setLoading(false);
    }
  }, [firebaseUser, isUserLoading]);

  const login = async (selectedUser: User, magicWord: string) => {
    setLoading(true);
    const email = roleEmails[selectedUser];
    try {
      await signInWithEmailAndPassword(auth, email, magicWord);
      // Auth state change will be handled by onAuthStateChanged
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, magicWord);
        } catch (createError) {
          console.error("Could not create user:", createError);
        }
      } else {
        console.error('Could not log in user:', error);
      }
    } finally {
      // Don't set loading to false here, wait for onAuthStateChanged
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Auth state change will be handled by onAuthStateChanged
      router.push('/');
    } catch (error) {
      console.error('Could not log out user:', error);
    }
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    