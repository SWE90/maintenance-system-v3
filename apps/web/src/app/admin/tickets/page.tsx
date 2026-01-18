'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import {
  TicketStatus,
  Priority,
  DeviceType,
  DEVICE_TYPE_LABELS_AR,
  STATUS_LABELS_AR,
  PRIORITY_LABELS_AR,
  ITicket,
  ITechnician,
} from '@maintenance/shared';
import {
  List,
  Map,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  UserPlus,
  Calendar,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';

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

// Filter Select Component
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'الكل',
}: FilterSelectProps) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none cursor-pointer hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// Ticket Card Component
interface TicketCardProps {
  ticket: ITicket;
  technicians: ITechnician[];
  onAssign: (ticketId: number) => void;
  onCall: (phone: string) => void;
  onLocation: (lat: number, lng: number) => void;
}

function TicketCard({
  ticket,
  technicians,
  onAssign,
  onCall,
  onLocation,
}: TicketCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <DeviceIcon
              deviceType={ticket.deviceType}
              className="w-6 h-6 text-gray-600"
            />
          </div>
          <div>
            <p className="font-bold text-gray-900" dir="ltr">
              #{ticket.ticketNumber}
            </p>
            <p className="text-sm text-gray-600">{ticket.customerName}</p>
            <p className="text-xs text-gray-400">{ticket.customerCity}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={ticket.status} size="sm" showDot />
          <PriorityBadge priority={ticket.priority} size="sm" />
        </div>
      </div>

      {/* Device & Problem */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>{DEVICE_TYPE_LABELS_AR[ticket.deviceType]}</span>
          <span>-</span>
          <span>{ticket.brand}</span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">
          {ticket.problemDescription}
        </p>
      </div>

      {/* Technician */}
      <div className="flex items-center justify-between mb-3">
        {ticket.technicianName ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {ticket.technicianName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {ticket.technicianName}
              </p>
              <p className="text-xs text-gray-400">الفني المسند</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAssign(ticket.id)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            إسناد لفني
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCall(ticket.customerPhone)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="اتصال"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => onLocation(ticket.latitude, ticket.longitude)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="الموقع"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
        <Link
          href={`/admin/tickets/${ticket.id}`}
          className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          التفاصيل
        </Link>
      </div>
    </div>
  );
}

// Map View Component (Placeholder)
function MapView({ tickets }: { tickets: ITicket[] }) {
  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 h-[600px] flex items-center justify-center">
      <div className="text-center text-gray-500">
        <Map className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">عرض الخريطة</p>
        <p className="text-sm">يحتوي على {tickets.length} تذكرة</p>
        <p className="text-xs mt-2 text-gray-400">
          سيتم إضافة خريطة Google Maps هنا
        </p>
      </div>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = useMemo(() => {
    const result: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          result.push(i);
        }
        result.push('...');
        result.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        result.push(1);
        result.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          result.push(i);
        }
      } else {
        result.push(1);
        result.push('...');
        result.push(currentPage - 1);
        result.push(currentPage);
        result.push(currentPage + 1);
        result.push('...');
        result.push(totalPages);
      }
    }

    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : page === '...'
              ? 'cursor-default text-gray-400'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}

// Assign Technician Modal
interface AssignModalProps {
  ticketId: number | null;
  technicians: ITechnician[];
  onClose: () => void;
  onAssign: (ticketId: number, technicianId: number) => void;
}

function AssignModal({
  ticketId,
  technicians,
  onClose,
  onAssign,
}: AssignModalProps) {
  const [selectedTech, setSelectedTech] = useState<number | null>(null);

  if (!ticketId) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-xl z-50">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">إسناد لفني</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => setSelectedTech(tech.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  selectedTech === tech.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">{tech.name}</p>
                  <p className="text-sm text-gray-500">
                    {tech.isAvailable ? (
                      <span className="text-green-600">متاح</span>
                    ) : (
                      <span className="text-red-600">مشغول</span>
                    )}
                    {' - '}
                    {tech.completedTasksToday} مهمة اليوم
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => selectedTech && onAssign(ticketId, selectedTech)}
            disabled={!selectedTech}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إسناد
          </button>
        </div>
      </div>
    </>
  );
}

// Saudi Arabia Cities
const SAUDI_CITIES = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الخبر',
  'الظهران',
  'الطائف',
  'تبوك',
  'بريدة',
  'حائل',
  'خميس مشيط',
  'أبها',
  'نجران',
  'جازان',
  'ينبع',
  'القطيف',
  'الجبيل',
  'الأحساء',
];

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filter state
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    technician: searchParams.get('technician') || '',
    city: searchParams.get('city') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    search: searchParams.get('search') || '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data state
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Modal state
  const [assignTicketId, setAssignTicketId] = useState<number | null>(null);

  // Load tickets
  const loadTickets = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.technician) params.technicianId = filters.technician;
      if (filters.city) params.city = filters.city;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.search) params.search = filters.search;

      const response = await api.getTasks(params);
      const items = response.items || response || [];
      setTickets(Array.isArray(items) ? items : []);
      setTotalItems(response.total || items.length);
      setTotalPages(Math.ceil((response.total || items.length) / itemsPerPage));
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, filters]);

  // Load technicians
  const loadTechnicians = useCallback(async () => {
    try {
      const response = await api.getTechnicians();
      const items = response.items || response || [];
      setTechnicians(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadTechnicians();
  }, [loadTickets, loadTechnicians]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    router.replace(`/admin/tickets${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  }, [filters, router]);

  // Handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      technician: '',
      city: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const handleAssign = async (ticketId: number, technicianId: number) => {
    try {
      await api.assignTechnician(ticketId, { technicianId });
      setAssignTicketId(null);
      loadTickets();
    } catch (error) {
      console.error('Error assigning technician:', error);
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleLocation = (lat: number, lng: number) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Status options
  const statusOptions = Object.entries(STATUS_LABELS_AR).map(([value, label]) => ({
    value,
    label,
  }));

  // Priority options
  const priorityOptions = Object.entries(PRIORITY_LABELS_AR).map(([value, label]) => ({
    value,
    label,
  }));

  // Technician options
  const technicianOptions = technicians.map((tech) => ({
    value: tech.id.toString(),
    label: tech.name,
  }));

  // City options
  const cityOptions = SAUDI_CITIES.map((city) => ({
    value: city,
    label: city,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل التذاكر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة التذاكر</h1>
          <p className="text-gray-500 mt-1">
            {totalItems} تذكرة
            {activeFiltersCount > 0 && ` (${activeFiltersCount} فلتر نشط)`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              قائمة
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              خريطة
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadTickets}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="بحث برقم التذكرة، اسم العميل، أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            فلاتر
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <FilterSelect
                label="الحالة"
                value={filters.status}
                onChange={(v) => handleFilterChange('status', v)}
                options={statusOptions}
              />
              <FilterSelect
                label="الأولوية"
                value={filters.priority}
                onChange={(v) => handleFilterChange('priority', v)}
                options={priorityOptions}
              />
              <FilterSelect
                label="الفني"
                value={filters.technician}
                onChange={(v) => handleFilterChange('technician', v)}
                options={technicianOptions}
              />
              <FilterSelect
                label="المدينة"
                value={filters.city}
                onChange={(v) => handleFilterChange('city', v)}
                options={cityOptions}
              />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <>
          {tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد تذاكر
              </h3>
              <p className="text-gray-500">
                {activeFiltersCount > 0
                  ? 'جرب تغيير الفلاتر للعثور على تذاكر'
                  : 'لا توجد تذاكر في النظام حالياً'}
              </p>
            </div>
          ) : (
            <>
              {/* Tickets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    technicians={technicians}
                    onAssign={setAssignTicketId}
                    onCall={handleCall}
                    onLocation={handleLocation}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    عرض {(currentPage - 1) * itemsPerPage + 1} -{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} من{' '}
                    {totalItems}
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <MapView tickets={tickets} />
      )}

      {/* Assign Modal */}
      <AssignModal
        ticketId={assignTicketId}
        technicians={technicians}
        onClose={() => setAssignTicketId(null)}
        onAssign={handleAssign}
      />
    </div>
  );
}
