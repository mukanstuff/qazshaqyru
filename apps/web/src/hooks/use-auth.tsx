'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  phone: string;
  language: 'kz' | 'ru';
  name: string | null;
  isAdmin: boolean;
}

interface Session {
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setLocale: (lang: 'kz' | 'ru') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        setSession(data.session || null);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setSession(null);
      if (typeof window !== 'undefined') window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const setLocale = useCallback(
    async (lang: 'kz' | 'ru') => {
      try {
        const response = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ language: lang }),
        });
        if (response.ok && user) {
          setUser({ ...user, language: lang });
        }
        if (typeof document !== 'undefined') {
          document.cookie = `locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } catch (error) {
        console.error('Set locale error:', error);
      }
    },
    [user]
  );

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, session, loading, logout, refreshSession, setLocale }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
