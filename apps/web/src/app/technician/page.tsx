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
  STATUS_LABELS_AR,
} from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Map,
  List,
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
} from 'lucide-react';

/** KPI tile data structure */
interface KpiTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

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

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    notFixed: 0,
  });

  // Fetch tasks
  const fetchTasks = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await api.getTasks({ technicianId: user?.id });
      const taskList = Array.isArray(response) ? response : response.items || [];
      setTasks(taskList);

      // Calculate KPIs
      const pending = taskList.filter(
        (t: TaskCardData) =>
          t.status === TicketStatus.SCHEDULED ||
          t.status === TicketStatus.ASSIGNED
      ).length;

      const inProgress = taskList.filter(
        (t: TaskCardData) =>
          t.status === TicketStatus.ON_ROUTE ||
          t.status === TicketStatus.ARRIVED ||
          t.status === TicketStatus.INSPECTING ||
          t.status === TicketStatus.DIAGNOSED ||
          t.status === TicketStatus.REPAIRING
      ).length;

      const completed = taskList.filter(
        (t: TaskCardData) => t.status === TicketStatus.COMPLETED
      ).length;

      const notFixed = taskList.filter(
        (t: TaskCardData) => t.status === TicketStatus.NOT_FIXED
      ).length;

      setKpis({ pending, inProgress, completed, notFixed });
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

  // KPI tiles configuration
  const kpiTiles: KpiTile[] = [
    {
      id: 'pending',
      label: 'في الانتظار',
      value: kpis.pending,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      id: 'inProgress',
      label: 'قيد التنفيذ',
      value: kpis.inProgress,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'completed',
      label: 'مكتملة',
      value: kpis.completed,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'notFixed',
      label: 'لم يتم الإصلاح',
      value: kpis.notFixed,
      icon: <XCircle className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  // Filter active tasks for display
  const activeTasks = tasks.filter(
    (t) =>
      t.status !== TicketStatus.COMPLETED &&
      t.status !== TicketStatus.NOT_FIXED &&
      t.status !== TicketStatus.CANCELLED
  );

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
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            مرحبا، {user?.nameAr || user?.name}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ar-SA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
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

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {kpiTiles.map((tile) => (
          <div
            key={tile.id}
            className={clsx(
              'rounded-xl p-4 flex items-center gap-3',
              tile.bgColor
            )}
          >
            <div className={tile.color}>{tile.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tile.value}</p>
              <p className="text-sm text-gray-600">{tile.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">المهام النشطة</h2>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <List className="w-4 h-4" />
            قائمة
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'map'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Map className="w-4 h-4" />
            خريطة
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد مهام نشطة حاليا</p>
            </div>
          ) : (
            activeTasks.map((task) => (
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
                    {/* Device Icon */}
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
            ))
          )}
        </div>
      ) : (
        /* Map View */
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="h-[400px] bg-gray-100 flex items-center justify-center relative">
            {/* Map placeholder - would integrate with Google Maps or Mapbox */}
            <div className="text-center text-gray-500">
              <Map className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">خريطة المهام</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTasks.length} مهمة نشطة
              </p>
            </div>

            {/* Task markers would be rendered here */}
            {activeTasks.map((task, index) => (
              <div
                key={task.id}
                className="absolute bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                style={{
                  top: `${20 + (index * 15) % 60}%`,
                  left: `${20 + (index * 20) % 60}%`,
                }}
                title={task.customerName}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Quick task list below map */}
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
            {activeTasks.map((task, index) => (
              <Link
                key={task.id}
                href={`/technician/tasks/${task.id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {task.customerName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {task.customerAddress}
                  </p>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
