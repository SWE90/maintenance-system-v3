'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { clsx } from 'clsx';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
  Shield,
  HelpCircle,
  FileText,
} from 'lucide-react';

/** Mock stats - in production, this would come from API */
const mockStats = {
  completedToday: 4,
  completedThisWeek: 23,
  completedThisMonth: 89,
  notFixedThisMonth: 5,
  averageRating: 4.7,
  totalRatings: 156,
};

/** Menu items */
const menuItems = [
  {
    icon: Bell,
    label: 'الإشعارات',
    href: '/technician/notifications',
    badge: 3,
  },
  {
    icon: Settings,
    label: 'الإعدادات',
    href: '/technician/settings',
  },
  {
    icon: Shield,
    label: 'الخصوصية والأمان',
    href: '/technician/privacy',
  },
  {
    icon: HelpCircle,
    label: 'المساعدة والدعم',
    href: '/technician/help',
  },
  {
    icon: FileText,
    label: 'الشروط والأحكام',
    href: '/technician/terms',
  },
];

export default function TechnicianProfilePage() {
  const { user, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);

  // Calculate rating stars
  const fullStars = Math.floor(mockStats.averageRating);
  const hasHalfStar = mockStats.averageRating % 1 >= 0.5;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {user?.nameAr || user?.name || 'الفني'}
              </h1>
              <p className="text-primary-100">فني صيانة</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Contact Info */}
          {user?.phone && (
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 text-gray-400" />
              <span dir="ltr">{user.phone}</span>
            </div>
          )}
          {user?.email && (
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5 text-gray-400" />
              <span dir="ltr">{user.email}</span>
            </div>
          )}

          {/* Availability Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">حالة التوفر</span>
            </div>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={clsx(
                'relative w-12 h-6 rounded-full transition-colors',
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              <div
                className={clsx(
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  isAvailable ? 'right-1' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900 mb-4">الإحصائيات</h2>

        {/* Rating */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-700">التقييم</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={clsx(
                    'w-4 h-4',
                    star <= fullStars
                      ? 'text-yellow-400 fill-yellow-400'
                      : star === fullStars + 1 && hasHalfStar
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-900">
              {mockStats.averageRating}
            </span>
            <span className="text-sm text-gray-500">
              ({mockStats.totalRatings} تقييم)
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">مكتملة اليوم</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {mockStats.completedToday}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">هذا الأسبوع</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {mockStats.completedThisWeek}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">هذا الشهر</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {mockStats.completedThisMonth}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">لم تصلح</span>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {mockStats.notFixedThisMonth}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">تسجيل الخروج</span>
      </button>

      {/* App Version */}
      <p className="text-center text-sm text-gray-400">
        الإصدار 3.0.0
      </p>
    </div>
  );
}
