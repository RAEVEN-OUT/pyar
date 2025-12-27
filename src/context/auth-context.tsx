
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

const roleEmails = {
  'Him': 'him@amoremduo.app',
  'Her': 'her@amoremduo.app'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { auth, isUserLoading, user: fbUser } = useFirebase();
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    if(!isUserLoading) {
      if (fbUser) {
        const role = fbUser.email === roleEmails.Him ? 'Him' : 'Her';
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
    
    const email = roleEmails[selectedUser];
    
    try {
      await signInWithEmailAndPassword(auth, email, magicWord);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If the user does not exist, try to create a new account.
        try {
          await createUserWithEmailAndPassword(auth, email, magicWord);
        } catch (createError: any) {
           // This will catch errors during creation, like 'auth/weak-password'.
           throw createError;
        }
      } else {
        // This will catch other sign-in errors like 'auth/invalid-credential'.
        throw error;
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
