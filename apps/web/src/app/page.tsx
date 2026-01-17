'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Portal Selector Page
 * Allows users to choose between Customer Portal and Staff Portal
 */
export default function PortalSelectorPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      const dashboardRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        supervisor: '/supervisor/dashboard',
        technician: '/technician/tasks',
        customer: '/customer/tickets',
      };
      router.replace(dashboardRoutes[user.role] || '/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">نظام الصيانة</h1>
          <p className="text-blue-200 text-lg">اختر البوابة للمتابعة</p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Customer Portal */}
          <Link
            href="/login/customer"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-green-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">بوابة العملاء</h2>
            <p className="text-gray-600 mb-4">
              تسجيل الدخول برقم الجوال لمتابعة طلبات الصيانة
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>الدخول الآن</span>
              <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>

          {/* Staff Portal */}
          <Link
            href="/login/staff"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">بوابة الموظفين</h2>
            <p className="text-gray-600 mb-4">
              للمشرفين والفنيين ومديري النظام
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>الدخول الآن</span>
              <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-blue-300 text-sm">
          <p>نظام الصيانة المتكامل V3</p>
        </div>
      </div>
    </div>
  );
}
