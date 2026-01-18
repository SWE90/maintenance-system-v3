'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  TicketStatus,
  STATUS_LABELS_AR,
  STATUS_BADGE_CLASSES,
  DEVICE_TYPE_LABELS_AR,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
} from '@maintenance/shared';

type TabType = 'active' | 'completed' | 'all';

interface Ticket {
  id: number;
  ticketNumber: string;
  trackingToken: string;
  status: TicketStatus;
  deviceType: string;
  brand: string;
  problemDescription: string;
  createdAt: string;
  scheduledDate?: string;
  technicianName?: string;
}

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks({ customerId: user?.id });
      const ticketList = Array.isArray(data) ? data : data.data || [];
      setTickets(ticketList);

      // Calculate stats
      const activeCount = ticketList.filter(
        (t: Ticket) => !TERMINAL_STATUSES.includes(t.status as TicketStatus)
      ).length;
      const completedCount = ticketList.filter(
        (t: Ticket) => t.status === TicketStatus.COMPLETED
      ).length;

      setStats({
        total: ticketList.length,
        active: activeCount,
        completed: completedCount,
      });
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === 'active') {
      return !TERMINAL_STATUSES.includes(ticket.status as TicketStatus);
    }
    if (activeTab === 'completed') {
      return ticket.status === TicketStatus.COMPLETED;
    }
    return true;
  });

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'active', label: 'نشطة', count: stats.active },
    { id: 'completed', label: 'مكتملة', count: stats.completed },
    { id: 'all', label: 'الكل', count: stats.total },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                مرحباً، {user?.name || 'عميلنا الكريم'}
              </h1>
              <p className="text-slate-400">ادارة طلبات الصيانة الخاصة بك</p>
            </div>
            <Link
              href="/customer/create"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">تذكرة جديدة</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<TicketIcon className="w-6 h-6" />}
              label="اجمالي التذاكر"
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={<CheckIcon className="w-6 h-6" />}
              label="مكتملة"
              value={stats.completed}
              color="green"
            />
            <StatCard
              icon={<ClockIcon className="w-6 h-6" />}
              label="تذاكر نشطة"
              value={stats.active}
              color="yellow"
            />
          </div>
        </div>
      </div>

      {/* Tickets Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Section Header */}
          <div className="p-4 md:p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">تذاكري</h2>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// Ticket Card Component
function TicketCard({ ticket }: { ticket: Ticket }) {
  const statusLabel = STATUS_LABELS_AR[ticket.status as TicketStatus] || ticket.status;
  const statusClass = STATUS_BADGE_CLASSES[ticket.status as TicketStatus] || 'bg-gray-100 text-gray-800';
  const deviceLabel = DEVICE_TYPE_LABELS_AR[ticket.deviceType] || ticket.deviceType;

  const isActive = ACTIVE_STATUSES.includes(ticket.status as TicketStatus);
  const isTerminal = TERMINAL_STATUSES.includes(ticket.status as TicketStatus);

  return (
    <Link
      href={`/customer/track?token=${ticket.trackingToken}`}
      className="block bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-colors border border-slate-600/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                جارية
              </span>
            )}
          </div>
          <h3 className="font-bold text-white mb-1">
            {deviceLabel} - {ticket.brand}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-1">
            {ticket.problemDescription}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>#{ticket.ticketNumber}</span>
            <span>{formatDate(ticket.createdAt)}</span>
            {ticket.technicianName && (
              <span className="text-blue-400">الفني: {ticket.technicianName}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </Link>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
        <TicketIcon className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">لا توجد تذاكر</h3>
      <p className="text-slate-400 mb-6">لم تقم بانشاء اي طلبات صيانة بعد</p>
      <Link
        href="/customer/create"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <PlusIcon className="w-5 h-5" />
        <span>انشاء تذكرة جديدة</span>
      </Link>
    </div>
  );
}

// Helper function
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Icons
function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
