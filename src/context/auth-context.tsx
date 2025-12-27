
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
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userCredentials = {
  'Him': { email: 'him@amoremduo.app' },
  'Her': { email: 'her@amoremduo.app' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { auth, isUserLoading, user: fbUser } = useFirebase();
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    if(!isUserLoading) {
      if (fbUser) {
        const role = fbUser.email === userCredentials.Him.email ? 'Him' : 'Her';
        setUser(role);
        localStorage.setItem('amorem-duo-user', role);
      } else {
        setUser(null);
        localStorage.removeItem('amorem-duo-user');
      }
      setLoading(false);
    }
  }, [fbUser, isUserLoading]);

  const login = async (selectedUser: User, magicWord: string) => {
    if (!auth) throw new Error("Auth service not available");
    
    const { email } = userCredentials[selectedUser];
    
    try {
      await signInWithEmailAndPassword(auth, email, magicWord);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, magicWord);
        } catch (createError: any) {
           if (createError.code === 'auth/weak-password') {
             throw new Error('Magic word must be at least 6 characters long.');
           }
           throw new Error('Could not create account. Please try again.');
        }
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('That\'s not the right magic word. Try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Could not log out user:', error);
    }
  };

  const value = { user, firebaseUser: fbUser, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
