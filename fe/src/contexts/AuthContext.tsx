'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, UserRegisterRequest, AuthResponse } from '@/types';
import { authService } from '@/lib/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: UserRegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => {},
  refreshUser: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const savedToken = localStorage.getItem('focusbuddy_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    try {
      const res = await authService.getMe();
      setUser(res.data);
      localStorage.setItem('focusbuddy_user', JSON.stringify(res.data));
      localStorage.setItem('focusbuddy_user_name', res.data.full_name);
      localStorage.setItem('focusbuddy_user_id', res.data.id);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      localStorage.removeItem('focusbuddy_token');
      localStorage.removeItem('focusbuddy_user');
      localStorage.removeItem('focusbuddy_user_name');
      localStorage.removeItem('focusbuddy_user_id');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<User> => {
    const res = await authService.login(credentials);
    const { access_token, user: loggedUser } = res.data;

    localStorage.setItem('focusbuddy_token', access_token);
    localStorage.setItem('focusbuddy_user', JSON.stringify(loggedUser));
    localStorage.setItem('focusbuddy_user_name', loggedUser.full_name);
    localStorage.setItem('focusbuddy_user_id', loggedUser.id);

    setToken(access_token);
    setUser(loggedUser);

    return loggedUser;
  };

  const register = async (data: UserRegisterRequest): Promise<User> => {
    const res = await authService.register(data);
    const { access_token, user: registeredUser } = res.data;

    localStorage.setItem('focusbuddy_token', access_token);
    localStorage.setItem('focusbuddy_user', JSON.stringify(registeredUser));
    localStorage.setItem('focusbuddy_user_name', registeredUser.full_name);
    localStorage.setItem('focusbuddy_user_id', registeredUser.id);

    setToken(access_token);
    setUser(registeredUser);

    return registeredUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout notification skipped:', err);
    } finally {
      localStorage.removeItem('focusbuddy_token');
      localStorage.removeItem('focusbuddy_user');
      localStorage.removeItem('focusbuddy_user_name');
      localStorage.removeItem('focusbuddy_user_id');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const res = await authService.getMe();
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
