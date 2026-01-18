'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  TicketStatus,
  CUSTOMER_STATUS_LABELS_AR,
  STATUS_BADGE_CLASSES,
  DEVICE_TYPE_LABELS_AR,
  TIME_SLOT_LABELS_AR,
  TERMINAL_STATUSES,
  ITicketStatusHistory,
} from '@maintenance/shared';

interface TrackingData {
  ticket: {
    ticketNumber: string;
    status: TicketStatus;
    deviceType: string;
    brand: string;
    problemDescription: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
    technicianName?: string;
    createdAt: string;
  };
  timeline: ITicketStatusHistory[];
  technicianLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  estimatedArrival?: string | null;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [searchToken, setSearchToken] = useState(initialToken);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(!!initialToken);
  const [error, setError] = useState<string | null>(null);

  // Load tracking data on mount if token provided
  useEffect(() => {
    if (initialToken) {
      loadTrackingData(initialToken);
    }
  }, [initialToken]);

  const loadTrackingData = async (trackingToken: string) => {
    if (!trackingToken.trim()) {
      setError('الرجاء ادخال رمز التتبع');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getTaskByTrackingToken(trackingToken);
      setTrackingData(data);
      setToken(trackingToken);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'لم يتم العثور على التذكرة';
      setError(message);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    loadTrackingData(searchToken);
  };

  const isTerminal = trackingData && TERMINAL_STATUSES.includes(trackingData.ticket.status);

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">تتبع طلب الصيانة</h1>
          <p className="text-slate-400">ادخل رمز التتبع لمعرفة حالة طلبك</p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                placeholder="ادخل رمز التتبع..."
                className="w-full pr-10 pl-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'بحث'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Tracking Results */}
        {isLoading && !trackingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : trackingData ? (
          <div className="space-y-6 animate-fade-in">
            {/* Status Card */}
            <div className={`rounded-2xl p-6 ${isTerminal ? 'bg-green-500/10 border border-green-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isTerminal ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {isTerminal ? (
                    <CheckIcon className="w-8 h-8 text-white" />
                  ) : (
                    <ClockIcon className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">الحالة الحالية</p>
                  <h2 className="text-xl font-bold text-white">
                    {CUSTOMER_STATUS_LABELS_AR[trackingData.ticket.status]}
                  </h2>
                </div>
              </div>

              {/* Estimated Arrival */}
              {trackingData.estimatedArrival && (
                <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                  <TruckIcon className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-sm text-slate-300">الوصول المتوقع</p>
                    <p className="font-medium text-white">
                      {formatDateTime(trackingData.estimatedArrival)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket Details */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-blue-400" />
                تفاصيل التذكرة
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">رقم التذكرة</p>
                  <p className="font-medium text-white" dir="ltr">{trackingData.ticket.ticketNumber}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">الجهاز</p>
                  <p className="font-medium text-white">
                    {DEVICE_TYPE_LABELS_AR[trackingData.ticket.deviceType]} - {trackingData.ticket.brand}
                  </p>
                </div>
                {trackingData.ticket.scheduledDate && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">موعد الزيارة</p>
                    <p className="font-medium text-white">
                      {formatDate(trackingData.ticket.scheduledDate)}
                      {trackingData.ticket.scheduledTimeSlot && (
                        <span className="text-slate-400 mr-2">
                          ({TIME_SLOT_LABELS_AR[trackingData.ticket.scheduledTimeSlot]})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {trackingData.ticket.technicianName && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">الفني المسؤول</p>
                    <p className="font-medium text-white">{trackingData.ticket.technicianName}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">المشكلة</p>
                <p className="text-white">{trackingData.ticket.problemDescription}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <TimelineIcon className="w-5 h-5 text-blue-400" />
                سجل الحالات
              </h3>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-slate-700" />

                {/* Timeline Items */}
                <div className="space-y-6">
                  {trackingData.timeline.map((entry, index) => (
                    <TimelineItem
                      key={entry.id}
                      entry={entry}
                      isFirst={index === 0}
                      isLast={index === trackingData.timeline.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Technician Location Map */}
            {trackingData.technicianLocation && !isTerminal && (
              <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <LocationIcon className="w-5 h-5 text-blue-400" />
                  موقع الفني
                </h3>

                <div className="h-48 bg-slate-700 rounded-lg overflow-hidden">
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${trackingData.technicianLocation.latitude},${trackingData.technicianLocation.longitude}&zoom=14&size=600x200&maptype=mapnik&markers=${trackingData.technicianLocation.latitude},${trackingData.technicianLocation.longitude},blue-pushpin`}
                    alt="Technician location"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  آخر تحديث: {formatDateTime(trackingData.technicianLocation.updatedAt)}
                </p>
              </div>
            )}

            {/* Help Section */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4">هل تحتاج مساعدة؟</h3>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="tel:+966xxxxxxxxx"
                  className="flex items-center gap-3 bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <PhoneIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">اتصل بنا</p>
                    <p className="font-medium text-white">خدمة العملاء</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/966xxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <WhatsappIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">واتساب</p>
                    <p className="font-medium text-white">تواصل معنا</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        ) : !isLoading && !error && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">ابحث عن تذكرتك</h3>
            <p className="text-slate-400">ادخل رمز التتبع للبحث عن حالة طلبك</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

// Timeline Item Component
function TimelineItem({
  entry,
  isFirst,
  isLast,
}: {
  entry: ITicketStatusHistory;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isCompleted = entry.toStatus === TicketStatus.COMPLETED;

  return (
    <div className="relative flex gap-4 pr-8">
      {/* Dot */}
      <div
        className={`absolute right-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
          isFirst
            ? 'bg-blue-500 border-blue-400'
            : isCompleted
            ? 'bg-green-500 border-green-400'
            : 'bg-slate-700 border-slate-600'
        }`}
      >
        {isFirst && <span className="w-2 h-2 bg-white rounded-full" />}
        {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-2 ${isFirst ? 'text-white' : 'text-slate-400'}`}>
        <h4 className={`font-medium ${isFirst ? 'text-white' : 'text-slate-300'}`}>
          {CUSTOMER_STATUS_LABELS_AR[entry.toStatus]}
        </h4>
        <p className="text-sm text-slate-500 mt-1">
          {formatDateTime(entry.createdAt as unknown as string)}
        </p>
        {entry.notes && (
          <p className="text-sm text-slate-400 mt-2 bg-slate-700/50 rounded-lg p-2">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function TimelineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
