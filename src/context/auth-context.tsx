'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
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

const TAB_KEY = 'tab_alive';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  /* --------------------------------
     Firebase auth state listener
  ----------------------------------*/
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const email = fbUser.email;

        if (email === USER_CREDENTIALS.Raveen.email) {
          setUser('Raveen');
        } else if (email === USER_CREDENTIALS.Priya.email) {
          setUser('Priya');
        }

        setFirebaseUser(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* --------------------------------
     Tab close / browser close logout
  ----------------------------------*/
  useEffect(() => {
    // Mark this tab as alive
    sessionStorage.setItem(TAB_KEY, 'true');

    const handleBeforeUnload = () => {
      // Remove marker — survives reload, dies on tab close
      sessionStorage.removeItem(TAB_KEY);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Delay to allow unload lifecycle to complete
        setTimeout(() => {
          if (!sessionStorage.getItem(TAB_KEY)) {
            // Best-effort logout (no await in unload lifecycle)
            signOut(auth);
          }
        }, 0);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /* --------------------------------
     Login
  ----------------------------------*/
  const login = useCallback(
    async (selectedUser: User, password: string) => {
      setLoading(true);

      const credentials = USER_CREDENTIALS[selectedUser];

      if (credentials.password !== password) {
        setLoading(false);
        throw new Error("That's not the right magic word. Please try again.");
      }

      try {
        await signInWithEmailAndPassword(
          auth,
          credentials.email,
          password
        );
        router.push('/chat');
      } catch (error: any) {
        setLoading(false);

        if (error.code === 'auth/user-not-found') {
          throw new Error("User account doesn't exist.");
        } else if (error.code === 'auth/wrong-password') {
          throw new Error("That's not the right magic word.");
        } else {
          throw new Error('Login failed. Please try again.');
        }
      }
    },
    [router]
  );

  /* --------------------------------
     Manual logout
  ----------------------------------*/
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

  const value = {
    user,
    loading,
    login,
    logout,
    firebaseUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
