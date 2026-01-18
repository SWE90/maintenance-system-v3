'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui';
import {
  TicketStatus,
  DeviceType,
  DEVICE_TYPE_LABELS_AR,
} from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  Phone,
  Navigation,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';

/** Task card data structure */
interface TaskCardData {
  id: number;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deviceType: DeviceType;
  brand: string;
  status: TicketStatus;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  priority: string;
  latitude: number;
  longitude: number;
}

/** Device type icons mapping */
const deviceIcons: Record<DeviceType, React.ReactNode> = {
  [DeviceType.AC]: <Wind className="w-5 h-5" />,
  [DeviceType.WASHER]: <CircleDot className="w-5 h-5" />,
  [DeviceType.FRIDGE]: <Refrigerator className="w-5 h-5" />,
  [DeviceType.OVEN]: <Flame className="w-5 h-5" />,
  [DeviceType.DISHWASHER]: <Waves className="w-5 h-5" />,
  [DeviceType.OTHER]: <HelpCircle className="w-5 h-5" />,
};

/** Time slot labels */
const timeSlotLabels: Record<string, string> = {
  morning: 'صباحا (8-12)',
  noon: 'ظهرا (12-5)',
  evening: 'مساء (5-11)',
};

/** Status filter options */
const statusFilters = [
  { value: 'all', label: 'الكل' },
  { value: 'active', label: 'نشطة' },
  { value: 'completed', label: 'مكتملة' },
  { value: 'not_fixed', label: 'لم تصلح' },
];

export default function TechnicianTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks
  const fetchTasks = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.getTasks({ technicianId: user?.id });
      const taskList = Array.isArray(response) ? response : response.items || [];
      setTasks(taskList);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (statusFilter === 'active') {
      if (
        task.status === TicketStatus.COMPLETED ||
        task.status === TicketStatus.NOT_FIXED ||
        task.status === TicketStatus.CANCELLED
      ) {
        return false;
      }
    } else if (statusFilter === 'completed') {
      if (task.status !== TicketStatus.COMPLETED) {
        return false;
      }
    } else if (statusFilter === 'not_fixed') {
      if (task.status !== TicketStatus.NOT_FIXED) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.ticketNumber.toLowerCase().includes(query) ||
        task.customerName.toLowerCase().includes(query) ||
        task.customerPhone.includes(query)
      );
    }

    return true;
  });

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate address
  const truncateAddress = (address: string, maxLength = 40) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  // Handle call
  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  // Handle navigation
  const handleNavigate = (lat: number, lng: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">المهام</h1>
        <button
          onClick={() => fetchTasks(true)}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshCw
            className={clsx('w-5 h-5', isRefreshing && 'animate-spin')}
          />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالرقم، الاسم، أو الجوال..."
          className="input pr-10"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === filter.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">لا توجد مهام</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              href={`/technician/tasks/${task.id}`}
              className="block"
            >
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500">
                      #{task.ticketNumber}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    {deviceIcons[task.deviceType] || deviceIcons[DeviceType.OTHER]}
                  </div>
                </div>

                {/* Customer Info */}
                <h3 className="font-semibold text-gray-900 mb-1">
                  {task.customerName}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {DEVICE_TYPE_LABELS_AR[task.deviceType]} - {task.brand}
                </p>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>{truncateAddress(task.customerAddress)}</span>
                </div>

                {/* Schedule */}
                {task.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatDate(task.scheduledDate)}
                      {task.scheduledTimeSlot &&
                        ` - ${timeSlotLabels[task.scheduledTimeSlot] || task.scheduledTimeSlot}`}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleCall(task.customerPhone, e)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">اتصال</span>
                  </button>
                  <button
                    onClick={(e) =>
                      handleNavigate(task.latitude, task.longitude, e)
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm font-medium">الملاحة</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
