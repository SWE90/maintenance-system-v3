'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  User,
  LogOut,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface TechnicianLayoutProps {
  children: ReactNode;
}

/** Navigation items for bottom nav */
const navItems = [
  { href: '/technician', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/technician/tasks', label: 'المهام', icon: ClipboardList },
  { href: '/technician/schedule', label: 'الجدول', icon: Calendar },
  { href: '/technician/profile', label: 'حسابي', icon: User },
];

export default function TechnicianLayout({ children }: TechnicianLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/technician') {
      return pathname === '/technician';
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header - Simple mobile header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Technician Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.nameAr || user?.name || 'الفني'}
              </p>
              <p className="text-xs text-gray-500">فني صيانة</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content - with bottom padding for nav */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 w-full h-full transition-colors',
                  active
                    ? 'text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <item.icon
                  className={clsx(
                    'w-6 h-6',
                    active && 'stroke-[2.5]'
                  )}
                />
                <span
                  className={clsx(
                    'text-xs',
                    active ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-0 w-12 h-0.5 bg-primary-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
