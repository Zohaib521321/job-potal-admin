'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: '📊', requiresSuperAdmin: false },
    { href: '/jobs', label: 'Jobs', icon: '💼', requiresSuperAdmin: false },
    { href: '/categories', label: 'Categories', icon: '🏷️', requiresSuperAdmin: false },
    { href: '/job-alerts', label: 'Job Alerts', icon: '🔔', requiresSuperAdmin: false },
    { href: '/feedback', label: 'Feedback', icon: '💬', requiresSuperAdmin: false },
    { href: '/contact', label: 'Contact', icon: '📧', requiresSuperAdmin: false },
    { href: '/analytics', label: 'Analytics', icon: '📈', requiresSuperAdmin: false },
    { href: '/admins', label: 'Admins', icon: '👨‍💼', requiresSuperAdmin: true },
  ];

  // Filter menu items based on admin role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.requiresSuperAdmin) {
      return admin?.role === 'super_admin';
    }
    return true;
  });

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-accent rounded-lg text-foreground"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-56 bg-background border-r border-accent min-h-screen fixed left-0 top-0 z-40 transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src={resolvedTheme === 'dark' ? '/logo_dark.png' : '/logo_light.png'}
              alt="Job Hunt Logo"
              width={140}
              height={140}
              className="object-contain"
            />
          </Link>
        </div>

        <nav className="px-2 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-foreground'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-accent">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">
                  {admin?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-xs truncate">
                  {admin?.username || 'Admin'}
                </p>
                <p className="text-text-secondary text-[10px] truncate">
                  {admin?.email || ''}
                </p>
              </div>
            </div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                admin?.role === 'super_admin'
                  ? 'bg-error/10 text-error'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <div className="mb-2">
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-error/10 hover:bg-error/20 text-error font-medium px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

