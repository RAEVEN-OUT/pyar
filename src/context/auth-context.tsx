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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('amorem-duo-user') as User | null;
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Could not access local storage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (selectedUser: User, magicWord: string) => {
    // In a real app, you'd verify the magicWord against Firebase here.
    // For this mock, we'll accept any password.
    setLoading(true);
    try {
      localStorage.setItem('amorem-duo-user', selectedUser);
      setUser(selectedUser);
      router.push('/chat');
    } catch (error) {
      console.error('Could not set user in local storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      localStorage.removeItem('amorem-duo-user');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Could not remove user from local storage:', error);
    } finally {
      setLoading(false);
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
