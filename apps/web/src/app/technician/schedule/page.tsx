'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui';
import { TicketStatus, DeviceType, DEVICE_TYPE_LABELS_AR } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';

/** Mock scheduled tasks - in production, this would come from API */
const mockScheduledTasks = [
  {
    id: 1,
    ticketNumber: 'TKT-001',
    customerName: 'محمد أحمد',
    customerAddress: 'حي النزهة، الرياض',
    deviceType: DeviceType.AC,
    brand: 'Samsung',
    status: TicketStatus.SCHEDULED,
    scheduledDate: '2026-01-18',
    scheduledTimeSlot: 'morning',
  },
  {
    id: 2,
    ticketNumber: 'TKT-002',
    customerName: 'فاطمة علي',
    customerAddress: 'حي العليا، الرياض',
    deviceType: DeviceType.WASHER,
    brand: 'LG',
    status: TicketStatus.SCHEDULED,
    scheduledDate: '2026-01-18',
    scheduledTimeSlot: 'noon',
  },
  {
    id: 3,
    ticketNumber: 'TKT-003',
    customerName: 'عبدالله السالم',
    customerAddress: 'حي الملقا، الرياض',
    deviceType: DeviceType.FRIDGE,
    brand: 'Hitachi',
    status: TicketStatus.SCHEDULED,
    scheduledDate: '2026-01-19',
    scheduledTimeSlot: 'morning',
  },
];

/** Time slot labels */
const timeSlotLabels: Record<string, string> = {
  morning: 'صباحا (8-12)',
  noon: 'ظهرا (12-5)',
  evening: 'مساء (5-11)',
};

/** Get days of current week */
const getWeekDays = (date: Date) => {
  const days = [];
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
};

export default function TechnicianSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = getWeekDays(currentDate);

  // Format date for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('ar-SA', { weekday: 'short' });
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Filter tasks for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const tasksForDate = mockScheduledTasks.filter(
    (task) => task.scheduledDate === selectedDateStr
  );

  // Count tasks per day
  const getTaskCountForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockScheduledTasks.filter((task) => task.scheduledDate === dateStr).length;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">الجدول</h1>
        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDate(new Date());
          }}
          className="text-sm text-primary-600 font-medium"
        >
          اليوم
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-900">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const taskCount = getTaskCountForDate(day);
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  'flex flex-col items-center py-2 px-1 rounded-lg transition-colors',
                  selected
                    ? 'bg-primary-600 text-white'
                    : today
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span className="text-xs font-medium mb-1">
                  {formatDayName(day)}
                </span>
                <span
                  className={clsx(
                    'w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold',
                    selected ? 'bg-white/20' : ''
                  )}
                >
                  {formatDayNumber(day)}
                </span>
                {taskCount > 0 && (
                  <div
                    className={clsx(
                      'w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium mt-1',
                      selected
                        ? 'bg-white text-primary-600'
                        : 'bg-primary-100 text-primary-700'
                    )}
                  >
                    {taskCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks for Selected Date */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {isToday(selectedDate)
            ? 'مهام اليوم'
            : `مهام ${selectedDate.toLocaleDateString('ar-SA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}`}
        </h3>

        {tasksForDate.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">لا توجد مهام مجدولة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasksForDate.map((task) => (
              <Link
                key={task.id}
                href={`/technician/tasks/${task.id}`}
                className="block"
              >
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-mono text-gray-500">
                        #{task.ticketNumber}
                      </span>
                      <StatusBadge status={task.status} size="sm" className="mr-2" />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{timeSlotLabels[task.scheduledTimeSlot]}</span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-1">
                    {task.customerName}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {DEVICE_TYPE_LABELS_AR[task.deviceType]} - {task.brand}
                  </p>

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{task.customerAddress}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
