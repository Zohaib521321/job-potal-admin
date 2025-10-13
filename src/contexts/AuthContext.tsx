'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchWithApiKey, apiPost } from '@/lib/api';

interface Admin {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthVerifyResponse {
  success: boolean;
  data: Admin;
}

interface AuthLoginResponse {
  success: boolean;
  data: {
    admin: Admin;
    token: string;
  };
  error?: {
    message?: string;
  };
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === '/login';
      
      if (!admin && !isLoginPage) {
        // Not authenticated and not on login page -> redirect to login
        router.push('/login');
      } else if (admin && isLoginPage) {
        // Authenticated and on login page -> redirect to dashboard
        router.push('/');
      }
    }
  }, [admin, isLoading, pathname, router]);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('adminToken');
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetchWithApiKey('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json() as AuthVerifyResponse;

      if (data.success) {
        setAdmin(data.data);
        setToken(storedToken);
      } else {
        // Invalid token
        localStorage.removeItem('adminToken');
        setAdmin(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminToken');
      setAdmin(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiPost<AuthLoginResponse>('/api/auth/login', { email, password });

      if (data.success) {
        setAdmin(data.data.admin);
        setToken(data.data.token);
        localStorage.setItem('adminToken', data.data.token);
        router.push('/');
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

