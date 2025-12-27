
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
import { doc, setDoc } from 'firebase/firestore';

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

// These are used to sign in, but also to create the account if it doesn't exist.
// Firebase requires passwords to be at least 6 characters.
const magicWords: Record<User, string> = {
  Him: '070805',
  Her: '210406',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, firestore, isUserLoading } = useFirebase();
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
      // First, try to sign in.
      const userCredential = await signInWithEmailAndPassword(auth, email, magicWord);
      // After successful sign in, ensure the user document exists
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, { id: userCredential.user.uid, role: selectedUser }, { merge: true });

    } catch (error: any) {
      // If the user doesn't exist, create the account.
      if (error.code === 'auth/user-not-found') {
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, magicWord);
          // Also create the user document in Firestore upon creation
          const userDocRef = doc(firestore, 'users', newUserCredential.user.uid);
          await setDoc(userDocRef, { id: newUserCredential.user.uid, role: selectedUser });

        } catch (creationError: any) {
           // Handle specific creation errors, like weak password
           if (creationError.code === 'auth/weak-password') {
             throw new Error('The magic word is too weak. Please contact support.');
           }
           throw new Error('Failed to create your account. Please try again.');
        }
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        // Handle incorrect password for an existing user
        throw new Error("That's not the right magic word. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        // Handle other errors
        console.error('Firebase login error:', error);
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }, [auth, firestore]);

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
