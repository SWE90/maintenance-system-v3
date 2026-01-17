'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';
import type { UserRole } from '@maintenance/shared';

interface User {
  id: number;
  email: string | null;
  phone: string | null;
  name: string;
  nameAr: string | null;
  role: UserRole;
  status: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, code: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const publicRoutes = ['/', '/login/staff', '/login/customer', '/track'];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  admin: ['/admin'],
  supervisor: ['/supervisor', '/admin'],
  technician: ['/technician'],
  customer: ['/customer'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith('/track/')
  );

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.getProfile();
        setUser(userData);
      } catch (error) {
        // Token might be expired, try refresh
        try {
          await refreshAuth();
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    // Allow public routes
    if (isPublicRoute) return;

    // Redirect to portal selector if not authenticated
    if (!user) {
      router.replace('/');
      return;
    }

    // Check role-based access
    const allowedPrefixes = roleRoutes[user.role] || [];
    const hasAccess = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (!hasAccess) {
      // Redirect to appropriate dashboard
      const dashboardRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
        technician: '/technician/tasks',
        customer: '/customer/tickets',
      };
      router.replace(dashboardRoutes[user.role] || '/');
    }
  }, [user, isLoading, pathname, isPublicRoute, router]);

  // Staff login
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.staffLogin(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);

    // Redirect based on role
    const dashboardRoutes: Record<string, string> = {
      admin: '/admin/dashboard',
      supervisor: '/supervisor/dashboard',
      technician: '/technician/tasks',
    };
    router.replace(dashboardRoutes[response.user.role] || '/');
  }, [router]);

  // Request OTP
  const requestOtp = useCallback(async (phone: string) => {
    await api.requestOtp(phone);
  }, []);

  // Customer OTP login
  const loginWithOtp = useCallback(async (phone: string, code: string) => {
    const response = await api.verifyOtp(phone, code);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    router.replace('/customer/tickets');
  }, [router]);

  // Logout
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.logout(refreshToken);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.replace('/');
    }
  }, [router]);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await api.refreshToken(refreshToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        requestOtp,
        logout,
        refreshAuth,
      }}
    >
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

/**
 * Hook to require authentication
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.user) {
      router.replace('/');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
      router.replace('/unauthorized');
    }
  }, [auth.isLoading, auth.user, allowedRoles, router]);

  return auth;
}
