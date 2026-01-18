'use client';

import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/ui';
import {
  DeviceType,
  DEVICE_TYPE_LABELS_AR,
  ITicket,
} from '@maintenance/shared';
import {
  Phone,
  MapPin,
  UserPlus,
  Eye,
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
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

export interface TicketCardProps {
  /** The ticket data to display */
  ticket: ITicket;
  /** Handler for assign button click */
  onAssign?: (ticketId: number) => void;
  /** Handler for call button click */
  onCall?: (phone: string) => void;
  /** Handler for location button click */
  onLocation?: (lat: number, lng: number) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Link base path for ticket details */
  detailsBasePath?: string;
}

/**
 * TicketCard Component
 * Displays a ticket summary card with status, priority, and quick actions
 */
export function TicketCard({
  ticket,
  onAssign,
  onCall,
  onLocation,
  showActions = true,
  className = '',
  detailsBasePath = '/admin/tickets',
}: TicketCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${className}`}
    >
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
        ) : showActions && onAssign ? (
          <button
            onClick={() => onAssign(ticket.id)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            إسناد لفني
          </button>
        ) : (
          <span className="text-sm text-gray-400">لم يتم الإسناد</span>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {onCall && (
              <button
                onClick={() => onCall(ticket.customerPhone)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="اتصال"
              >
                <Phone className="w-5 h-5" />
              </button>
            )}
            {onLocation && (
              <button
                onClick={() => onLocation(ticket.latitude, ticket.longitude)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="الموقع"
              >
                <MapPin className="w-5 h-5" />
              </button>
            )}
          </div>
          <Link
            href={`${detailsBasePath}/${ticket.id}`}
            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            التفاصيل
          </Link>
        </div>
      )}
    </div>
  );
}

export default TicketCard;
