'use client';

import { TicketStatus, STATUS_BADGE_CLASSES, STATUS_LABELS_AR } from '@maintenance/shared';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  /** The ticket status to display */
  status: TicketStatus;
  /** Optional additional CSS classes */
  className?: string;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a dot indicator */
  showDot?: boolean;
}

/**
 * StatusBadge Component
 * Displays ticket status with proper colors and Arabic labels
 */
export function StatusBadge({
  status,
  className,
  size = 'md',
  showDot = false,
}: StatusBadgeProps) {
  const badgeClasses = STATUS_BADGE_CLASSES[status] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS_AR[status] || status;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const dotColors: Record<TicketStatus, string> = {
    [TicketStatus.NEW]: 'bg-blue-500',
    [TicketStatus.ASSIGNED]: 'bg-indigo-500',
    [TicketStatus.SCHEDULED]: 'bg-purple-500',
    [TicketStatus.ON_ROUTE]: 'bg-yellow-500',
    [TicketStatus.ARRIVED]: 'bg-orange-500',
    [TicketStatus.INSPECTING]: 'bg-cyan-500',
    [TicketStatus.DIAGNOSED]: 'bg-teal-500',
    [TicketStatus.REPAIRING]: 'bg-sky-500',
    [TicketStatus.WAITING_PARTS]: 'bg-amber-500',
    [TicketStatus.PICKUP_DEVICE]: 'bg-pink-500',
    [TicketStatus.IN_WORKSHOP]: 'bg-fuchsia-500',
    [TicketStatus.READY_DELIVERY]: 'bg-lime-500',
    [TicketStatus.COMPLETED]: 'bg-green-500',
    [TicketStatus.NOT_FIXED]: 'bg-red-500',
    [TicketStatus.CANCELLED]: 'bg-gray-500',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        badgeClasses,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={clsx(
            'rounded-full',
            dotColors[status] || 'bg-gray-500',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'
          )}
        />
      )}
      {label}
    </span>
  );
}

export default StatusBadge;
