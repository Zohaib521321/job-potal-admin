'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

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

  // If authenticated, show the page
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - AuthContext will handle redirect
  return null;
}


