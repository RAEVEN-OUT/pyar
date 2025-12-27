
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

export type User = 'Him' | 'Her';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAGIC_WORDS: Record<User, string> = {
  Him: '070805',
  Her: '210406',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for saved user session in local storage for persistence
    const savedUser = localStorage.getItem('amorem_duo_user') as User | null;
    if (savedUser) {
      setUserRole(savedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (selectedUser: User, magicWord: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (MAGIC_WORDS[selectedUser] === magicWord) {
      setUserRole(selectedUser);
      localStorage.setItem('amorem_duo_user', selectedUser);
      router.push('/chat'); // This was missing
    } else {
      setLoading(false);
      throw new Error('That\'s not the right magic word. Please try again.');
    }
  }, [router]);

  const logout = useCallback(async () => {
    setUserRole(null);
    localStorage.removeItem('amorem_duo_user');
    router.push('/');
  }, [router]);
  
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
