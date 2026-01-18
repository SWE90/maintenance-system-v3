'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useRequireAuth } from '@/lib/auth';
import { UserRole } from '@maintenance/shared';
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  User,
  Search,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

// Navigation items
const navItems = [
  {
    href: '/admin',
    label: 'لوحة التحكم',
    labelEn: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/tickets',
    label: 'التذاكر',
    labelEn: 'Tickets',
    icon: Ticket,
  },
  {
    href: '/admin/technicians',
    label: 'الفنيين',
    labelEn: 'Technicians',
    icon: Users,
  },
  {
    href: '/admin/reports',
    label: 'التقارير',
    labelEn: 'Reports',
    icon: BarChart3,
  },
  {
    href: '/admin/settings',
    label: 'الإعدادات',
    labelEn: 'Settings',
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoading } = useRequireAuth([UserRole.ADMIN, UserRole.SUPERVISOR]);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: string }[]>([
    { id: 1, message: 'تذكرة جديدة تنتظر الإسناد', type: 'info' },
    { id: 2, message: 'تصعيد L2 - تذكرة #1234', type: 'warning' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full bg-slate-900 z-50
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72 lg:w-auto
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">لوحة الإدارة</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute bottom-20 left-0 w-6 h-10 bg-slate-800 items-center justify-center rounded-r-lg hover:bg-slate-700 transition-colors transform -translate-x-full"
          title={sidebarCollapsed ? 'توسيع' : 'طي'}
        >
          <ChevronLeft
            className={`w-4 h-4 text-slate-400 transition-transform ${
              sidebarCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'المسؤول'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.role === UserRole.ADMIN ? 'مدير النظام' : 'مشرف'}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64'}
        `}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="h-16 flex items-center justify-between px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث عن تذكرة، عميل، أو فني..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">الإشعارات</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            لا توجد إشعارات
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                notification.type === 'warning'
                                  ? 'bg-yellow-50'
                                  : ''
                              }`}
                            >
                              <p className="text-sm text-gray-700">
                                {notification.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-100">
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                          عرض جميع الإشعارات
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Avatar (Mobile) */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
