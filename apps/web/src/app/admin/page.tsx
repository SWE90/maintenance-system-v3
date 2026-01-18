'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import {
  TicketStatus,
  Priority,
  DeviceType,
  DEVICE_TYPE_LABELS_AR,
  ITicket,
  IEscalation,
  EscalationLevel,
} from '@maintenance/shared';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  ArrowLeft,
  Phone,
  MapPin,
  UserPlus,
  Calendar,
  RefreshCw,
} from 'lucide-react';

// KPI Card Component
interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
}

function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  change,
  href,
}: KPICardProps) {
  const content = (
    <div className={`p-6 rounded-xl ${bgColor} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 ${!change.isPositive ? 'rotate-180' : ''}`}
              />
              <span>{change.value}% من الأمس</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// Device Icon Component
function DeviceIcon({
  deviceType,
  className,
}: {
  deviceType: DeviceType;
  className?: string;
}) {
  const icons = {
    [DeviceType.AC]: Wind,
    [DeviceType.WASHER]: CircleDot,
    [DeviceType.FRIDGE]: Refrigerator,
    [DeviceType.OVEN]: Flame,
    [DeviceType.DISHWASHER]: Waves,
    [DeviceType.OTHER]: HelpCircle,
  };
  const Icon = icons[deviceType] || HelpCircle;
  return <Icon className={className} />;
}

// Recent Ticket Card Component
interface RecentTicketCardProps {
  ticket: ITicket;
}

function RecentTicketCard({ ticket }: RecentTicketCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <DeviceIcon deviceType={ticket.deviceType} className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900" dir="ltr">
              #{ticket.ticketNumber}
            </p>
            <p className="text-sm text-gray-500">{ticket.customerName}</p>
          </div>
        </div>
        <StatusBadge status={ticket.status} size="sm" />
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {ticket.problemDescription}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {ticket.customerCity}
          </span>
          <PriorityBadge priority={ticket.priority} size="sm" />
        </div>
        <Link
          href={`/admin/tickets/${ticket.id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          عرض
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// Escalation Alert Component
interface EscalationAlertProps {
  escalation: IEscalation & { ticket?: Partial<ITicket> };
}

function EscalationAlert({ escalation }: EscalationAlertProps) {
  const levelColors = {
    [EscalationLevel.L1]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    [EscalationLevel.L2]: 'bg-orange-100 border-orange-300 text-orange-800',
    [EscalationLevel.L3]: 'bg-red-100 border-red-300 text-red-800',
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        levelColors[escalation.level]
      }`}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="font-medium">
            تصعيد {escalation.level} - تذكرة #{escalation.ticket?.ticketNumber || escalation.ticketId}
          </p>
          <p className="text-sm opacity-80">{escalation.reason}</p>
        </div>
      </div>
      <Link
        href={`/admin/tickets/${escalation.ticketId}`}
        className="px-3 py-1 bg-white/80 rounded-lg text-sm font-medium hover:bg-white transition-colors"
      >
        معالجة
      </Link>
    </div>
  );
}

// Quick Action Button Component
interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors ${color}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    completed: 0,
    activeEscalations: 0,
  });
  const [recentTickets, setRecentTickets] = useState<ITicket[]>([]);
  const [escalations, setEscalations] = useState<(IEscalation & { ticket?: Partial<ITicket> })[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);

      // Load stats
      const statsData = await api.getDashboardStats();
      setStats({
        total: statsData.total || 0,
        new: statsData.byStatus?.new || 0,
        inProgress: statsData.inProgress || 0,
        completed: statsData.byStatus?.completed || 0,
        activeEscalations: statsData.activeEscalations || 0,
      });

      // Load recent tickets
      const ticketsData = await api.getTasks({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRecentTickets(ticketsData.items || ticketsData || []);

      // Mock escalations for now
      setEscalations([
        {
          id: 1,
          ticketId: 1234,
          level: EscalationLevel.L2,
          type: 'assignment_delay' as any,
          reason: 'تأخر في إسناد التذكرة لأكثر من 4 ساعات',
          isResolved: false,
          createdAt: new Date(),
          ticket: { ticketNumber: 'TKT-001234' },
        },
        {
          id: 2,
          ticketId: 5678,
          level: EscalationLevel.L1,
          type: 'sla_breach' as any,
          reason: 'تجاوز وقت الاستجابة المتوقع',
          isResolved: false,
          createdAt: new Date(),
          ticket: { ticketNumber: 'TKT-005678' },
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">نظرة عامة على نظام الصيانة</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="إجمالي التذاكر"
          value={stats.total}
          icon={Ticket}
          iconColor="bg-blue-500"
          bgColor="bg-blue-50"
          href="/admin/tickets"
        />
        <KPICard
          title="جديدة"
          value={stats.new}
          icon={Clock}
          iconColor="bg-indigo-500"
          bgColor="bg-indigo-50"
          href="/admin/tickets?status=new"
        />
        <KPICard
          title="قيد التنفيذ"
          value={stats.inProgress}
          icon={Users}
          iconColor="bg-amber-500"
          bgColor="bg-amber-50"
          href="/admin/tickets?status=in_progress"
        />
        <KPICard
          title="مكتملة"
          value={stats.completed}
          icon={CheckCircle}
          iconColor="bg-green-500"
          bgColor="bg-green-50"
          change={{ value: 12, isPositive: true }}
          href="/admin/tickets?status=completed"
        />
        <KPICard
          title="تصعيدات نشطة"
          value={stats.activeEscalations}
          icon={AlertTriangle}
          iconColor="bg-red-500"
          bgColor="bg-red-50"
        />
      </div>

      {/* Active Escalations */}
      {escalations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              تصعيدات نشطة
            </h2>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              {escalations.length}
            </span>
          </div>
          <div className="space-y-3">
            {escalations.map((escalation) => (
              <EscalationAlert key={escalation.id} escalation={escalation} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Tickets & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">التذاكر الأخيرة</h2>
            <Link
              href="/admin/tickets"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد تذاكر حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <RecentTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={UserPlus}
              label="إسناد تذكرة"
              href="/admin/tickets?action=assign"
              color="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            />
            <QuickAction
              icon={Calendar}
              label="جدولة زيارة"
              href="/admin/tickets?action=schedule"
              color="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
            />
            <QuickAction
              icon={Phone}
              label="تذاكر للاتصال"
              href="/admin/tickets?status=new"
              color="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            />
            <QuickAction
              icon={AlertTriangle}
              label="التصعيدات"
              href="/admin/escalations"
              color="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            />
          </div>

          {/* Today's Summary */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ملخص اليوم</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">تذاكر مسندة</span>
                <span className="font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">تذاكر مكتملة</span>
                <span className="font-medium text-green-600">8</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">متوسط وقت الإغلاق</span>
                <span className="font-medium text-gray-900">2.5 ساعة</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">رضا العملاء</span>
                <span className="font-medium text-green-600">4.8/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
