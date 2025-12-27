
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
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

// This is a simplified, non-persistent auth system for demonstration.
// In a real app, you'd use a proper authentication service.
const MAGIC_WORDS: { [key in User]: string } = {
  Him: '070805',
  Her: '210406',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a logged-in user (e.g., from localStorage)
    const storedUser = localStorage.getItem('amorem-duo-user') as User | null;
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (selectedUser: User, magicWord: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (magicWord === MAGIC_WORDS[selectedUser]) {
      setUser(selectedUser);
      localStorage.setItem('amorem-duo-user', selectedUser);
      router.push('/chat');
    } else {
      setLoading(false);
      throw new Error("That's not the right magic word. Try again.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('amorem-duo-user');
    router.push('/');
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
