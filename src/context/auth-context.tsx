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
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type User = 'Raveen' | 'Priya';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, password: string) => Promise<void>;
  logout: () => void;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CREDENTIALS: Record<User, { email: string; password: string }> = {
  Raveen: { email: 'raveenkumar785@gmail.com', password: '070805' },
  Priya: { email: 'jayapriyakalidas@gmail.com', password: '210406' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase email to User type
        const email = firebaseUser.email;
        if (email === USER_CREDENTIALS.Raveen.email) {
          setUser('Raveen');
        } else if (email === USER_CREDENTIALS.Priya.email) {
          setUser('Priya');
        }
        setFirebaseUser(firebaseUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (selectedUser: User, password: string) => {
    setLoading(true);
    const credentials = USER_CREDENTIALS[selectedUser];
    
    if (credentials.password !== password) {
      setLoading(false);
      throw new Error("That's not the right magic word. Please try again.");
    }

    try {
      await signInWithEmailAndPassword(auth, credentials.email, password);
      router.push('/chat');
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/user-not-found') {
        throw new Error("User account doesn't exist. Please contact support.");
      } else if (error.code === 'auth/wrong-password') {
        throw new Error("That's not the right magic word. Please try again.");
      } else {
        throw new Error("Login failed. Please try again.");
      }
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);
  
  const value = { user, loading, login, logout, firebaseUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}