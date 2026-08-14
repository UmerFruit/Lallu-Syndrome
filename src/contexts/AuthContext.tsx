import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuthState, onAuthChange, logout as authLogout } from '@/services/authService';
import type { User } from '@supabase/supabase-js';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const state = await getAuthState();
      setUser(state.user);
      setIsLoading(false);
    };
    initializeAuth();

    const unsub = onAuthChange((state) => {
      setUser(state.user);
      setIsLoading(state.isLoading);
    });
    return unsub;
  }, []);

  const logout = async (): Promise<void> => {
    await authLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
