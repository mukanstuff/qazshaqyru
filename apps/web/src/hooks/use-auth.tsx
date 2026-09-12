'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  /** Null for accounts that signed up via Google and never added a phone. */
  phone: string | null;
  language: 'kz' | 'ru';
  name: string | null;
  isAdmin: boolean;
  /** Can this account sign in with phone + password? */
  hasPassword: boolean;
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
  setName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Set once the browser has committed to leaving the page.
 *
 * The session request is then aborted by the navigation itself, which is not
 * something to report and not something to draw conclusions from.
 */
let leavingPage = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    leavingPage = true;
  });
}

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
      /*
       * A request that never arrived is not a signed-out user.
       *
       * This branch used to clear the user on any thrown error, and leaving a
       * page mid-request throws `TypeError: Failed to fetch` — so an ordinary
       * click from /templates to /templates/wedding logged an error and wiped
       * the client's idea of who is signed in, on a session that was perfectly
       * valid. Only an answer from the server decides that; a dropped
       * connection leaves the last known state alone.
       */
      if (!leavingPage) {
        console.warn('Session refresh failed, keeping last known state:', error);
      }
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

  const setName = useCallback(
    async (name: string) => {
      try {
        const response = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name }),
        });
        if (response.ok && user) {
          setUser({ ...user, name });
        }
      } catch (error) {
        console.error('Set name error:', error);
      }
    },
    [user]
  );

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, session, loading, logout, refreshSession, setLocale, setName }}>
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
