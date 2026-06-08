import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/api';
import type { AuthSession } from '../types';

interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const storedToken = localStorage.getItem('access_token');
      const storedUser  = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        const expiresAt = Number(localStorage.getItem('expires_at') ?? 0);
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt > 0 && now >= expiresAt - 60) {
          // Token expired or expiring soon — refresh proactively
          const newToken = await authService.refresh();
          if (newToken) {
            setToken(newToken);
            setUser(JSON.parse(storedUser));
          }
          // If refresh failed, auth:expired event already cleared the session
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }

      setIsLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    function handleExpired() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  function saveSession(session: AuthSession, authUser: AuthUser) {
    localStorage.setItem('access_token',  session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token);
    localStorage.setItem('expires_at',    String(session.expires_at));
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    setToken(session.access_token);
    setUser(authUser);
  }

  function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }

  async function login(email: string, password: string) {
    const data = await authService.login(email, password);
    saveSession(data.session, {
      id:       data.user.id,
      email:    data.user.email,
      username: data.user.user_metadata?.username ?? email.split('@')[0],
    });
  }

  async function register(email: string, password: string, username: string) {
    await authService.register(email, password, username);
  }

  async function logout() {
    try { await authService.logout(); } catch { /* token may be expired */ }
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
