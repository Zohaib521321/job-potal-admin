'use client';

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
    <aside className="w-64 bg-background border-r border-accent min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src={resolvedTheme === 'dark' ? '/logo_dark.png' : '/logo_light.png'}
            alt="Job Hunt Logo"
            width={180}
            height={180}
            className="object-contain"
          />
          <div>
           
          </div>
        </Link>
      </div>

      <nav className="px-3 space-y-1">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-foreground'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-accent">
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {admin?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium text-sm truncate">
                {admin?.username || 'Admin'}
              </p>
              <p className="text-text-secondary text-xs truncate">
                {admin?.email || ''}
              </p>
            </div>
          </div>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              admin?.role === 'super_admin'
                ? 'bg-error/10 text-error'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>
        <div className="mb-3">
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}

