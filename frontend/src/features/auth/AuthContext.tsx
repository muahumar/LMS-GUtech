import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  rollNo?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: 'admin' | 'teacher' | 'student' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordAttempt: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
  demoSwitchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('gutech_lms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const profile = await api.get<UserProfile>('/auth/me');
      setUser(profile);
      sessionStorage.setItem('gutech_lms_user', JSON.stringify(profile));
    } catch {
      setUser(null);
      sessionStorage.removeItem('gutech_lms_user');
      api.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, passwordAttempt: string): Promise<UserProfile> => {
    const res = await api.post<{ accessToken: string; refreshToken: string; profile: UserProfile }>('/auth/login', {
      email,
      password: passwordAttempt,
    });

    api.setToken(res.accessToken);
    setUser(res.profile);
    sessionStorage.setItem('gutech_lms_user', JSON.stringify(res.profile));
    return res.profile;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      api.setToken(null);
      setUser(null);
      sessionStorage.removeItem('gutech_lms_user');
    }
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      const merged = { ...user, ...updated };
      setUser(merged);
      sessionStorage.setItem('gutech_lms_user', JSON.stringify(merged));
    }
  };

  const demoSwitchUser = async (email: string) => {
    setIsLoading(true);
    try {
      await login(email, 'Password123!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
        demoSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
