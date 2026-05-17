import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, ApiUser } from '../services/apiClient.ts';

interface AuthContextType {
  user: ApiUser | null;
  isGuest: boolean;
  requireAuth: () => boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  logout: () => void;
  showGuestGate: boolean;
  setShowGuestGate: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [showGuestGate, setShowGuestGate] = useState(false);

  useEffect(() => {
    const stored = authApi.currentUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  const requireAuth = useCallback(() => {
    if (!user) {
      setShowGuestGate(true);
      return false;
    }
    return true;
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login(email, password);
    setUser(loggedInUser);
    setShowGuestGate(false);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const isGuest = user === null;

  return (
    <AuthContext.Provider value={{ user, isGuest, requireAuth, login, logout, showGuestGate, setShowGuestGate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
