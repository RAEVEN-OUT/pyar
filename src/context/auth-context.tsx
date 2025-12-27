
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

export type User = 'Raveen' | 'Priya';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, magicWord: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CREDENTIALS: Record<User, { magicWord: string }> = {
  Raveen: { magicWord: '070805' },
  Priya: { magicWord: 'pyar' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in from localStorage
    try {
      const storedUser = localStorage.getItem('only_mine_user');
      if (storedUser) {
        setUser(storedUser as User);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (selectedUser: User, magicWord: string) => {
    setLoading(true);
    const credentials = USER_CREDENTIALS[selectedUser];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (credentials.magicWord === magicWord) {
      setUser(selectedUser);
      try {
        localStorage.setItem('only_mine_user', selectedUser);
      } catch (e) {
        console.error("Could not access localStorage", e);
      }
      router.push('/chat');
    } else {
      setLoading(false);
      throw new Error("That's not the right magic word. Please try again.");
    }
  }, [router]);

  const logout = useCallback(async () => {
    setUser(null);
     try {
        localStorage.removeItem('only_mine_user');
      } catch (e) {
        console.error("Could not access localStorage", e);
      }
    router.push('/');
  }, [router]);
  
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
