
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
  login: (user: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a local-only setup, we can immediately determine the auth state.
    // If you were checking a token in localStorage, you'd do it here.
    setLoading(false);
  }, []);

  const login = useCallback(async (selectedUser: User) => {
    // Simple login, just sets the user role.
    setLoading(true);
    setUserRole(selectedUser);
    setLoading(false);
    router.push('/chat'); // Redirect to a protected page
  }, [router]);

  const logout = useCallback(async () => {
    setUserRole(null);
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
