
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
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';

export type User = 'Raveen' | 'Priya';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CREDENTIALS: Record<User, { email: string; magicWord: string }> = {
  Raveen: { email: 'raveen@amorem.duo', magicWord: '070805' },
  Priya: { email: 'priya@amorem.duo', magicWord: '210406' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { auth, firestore } = useFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const role = user.email === USER_CREDENTIALS.Raveen.email ? 'Raveen' : 'Priya';
        setUserRole(role);
        localStorage.setItem('only_mine_user', role);
      } else {
        setUserRole(null);
        localStorage.removeItem('only_mine_user');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = useCallback(async (selectedUser: User, magicWord: string) => {
    setLoading(true);
    const credentials = USER_CREDENTIALS[selectedUser];
    if (credentials.magicWord !== magicWord) {
      setLoading(false);
      throw new Error('That\'s not the right magic word. Please try again.');
    }

    try {
      // Use the magicWord from the form input as the password
      await signInWithEmailAndPassword(auth, credentials.email, magicWord);
      router.push('/chat');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          // Use the magicWord from the form input as the password
          await createUserWithEmailAndPassword(auth, credentials.email, magicWord);
           router.push('/chat');
        } catch (creationError) {
          console.error("Error creating user:", creationError);
          setLoading(false);
          throw new Error('Could not create an account. Please try again.');
        }
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setLoading(false);
        throw new Error('That\'s not the right magic word. Please try again.');
      }
      else {
        console.error("Error signing in:", error);
        setLoading(false);
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }, [auth, router]);

  const logout = useCallback(async () => {
    await auth.signOut();
    router.push('/');
  }, [auth, router]);
  
  const value = { user: userRole, firebaseUser, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
