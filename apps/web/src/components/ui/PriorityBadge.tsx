'use client';

import { Priority, PRIORITY_BADGE_CLASSES, PRIORITY_LABELS_AR } from '@maintenance/shared';
import { clsx } from 'clsx';
import { AlertCircle, AlertTriangle, ArrowDown, Minus } from 'lucide-react';

export interface PriorityBadgeProps {
  /** The priority level to display */
  priority: Priority;
  /** Optional additional CSS classes */
  className?: string;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show an icon */
  showIcon?: boolean;
}

/**
 * PriorityBadge Component
 * Displays priority level with proper colors and Arabic labels
 */
export function PriorityBadge({
  priority,
  className,
  size = 'md',
  showIcon = true,
}: PriorityBadgeProps) {
  const badgeClasses = PRIORITY_BADGE_CLASSES[priority] || 'bg-gray-100 text-gray-800';
  const label = PRIORITY_LABELS_AR[priority] || priority;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const PriorityIcon = {
    [Priority.LOW]: ArrowDown,
    [Priority.NORMAL]: Minus,
    [Priority.HIGH]: AlertTriangle,
    [Priority.URGENT]: AlertCircle,
  }[priority] || Minus;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        badgeClasses,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <PriorityIcon
          size={iconSizes[size]}
          className={priority === Priority.URGENT ? 'animate-pulse' : ''}
        />
      )}
      {label}
    </span>
  );
}

export default PriorityBadge;
