'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, admin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check super admin access - Hook must be called before any returns
  useEffect(() => {
    if (!isLoading && isAuthenticated && requireSuperAdmin && admin?.role !== 'super_admin') {
      // Not a super admin - redirect to dashboard
      router.push('/');
    }
  }, [isLoading, isAuthenticated, requireSuperAdmin, admin, router]);

  // Allow login page to be accessed without authentication
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, AuthContext will handle redirect
  if (!isAuthenticated) {
    return null;
  }

  // If super admin is required and user is not super admin, show access denied
  if (requireSuperAdmin && admin?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-text-secondary mb-4">You need super admin privileges to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary text-background font-semibold px-6 py-2 rounded-lg hover:bg-primary-dark transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated (and is super admin if required)
  return <>{children}</>;
}


