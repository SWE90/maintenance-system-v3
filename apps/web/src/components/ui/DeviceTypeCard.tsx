'use client';

import { DeviceType, DEVICE_TYPE_LABELS_AR, DEVICE_TYPE_ICONS } from '@maintenance/shared';
import { clsx } from 'clsx';
import {
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export interface DeviceTypeCardProps {
  /** The device type */
  deviceType: DeviceType;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Click handler */
  onClick?: (deviceType: DeviceType) => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

// Map icon names from constants to actual components
const iconMap: Record<string, LucideIcon> = {
  Wind: Wind,
  CircleDot: CircleDot,
  Refrigerator: Refrigerator,
  Flame: Flame,
  Waves: Waves,
  HelpCircle: HelpCircle,
};

/**
 * DeviceTypeCard Component
 * A selectable card for device types with icon and Arabic label
 */
export function DeviceTypeCard({
  deviceType,
  isSelected = false,
  onClick,
  disabled = false,
  className,
}: DeviceTypeCardProps) {
  const label = DEVICE_TYPE_LABELS_AR[deviceType] || deviceType;
  const iconName = DEVICE_TYPE_ICONS[deviceType] || 'HelpCircle';
  const IconComponent = iconMap[iconName] || HelpCircle;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(deviceType);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
        'min-w-[100px] min-h-[100px]',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        {
          // Selected state
          'border-primary-500 bg-primary-50 text-primary-700 shadow-md': isSelected,
          // Unselected state
          'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50':
            !isSelected && !disabled,
          // Disabled state
          'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed': disabled,
        },
        className
      )}
      aria-pressed={isSelected}
      aria-label={label}
    >
      <IconComponent
        size={32}
        className={clsx({
          'text-primary-600': isSelected,
          'text-gray-500': !isSelected && !disabled,
          'text-gray-300': disabled,
        })}
      />
      <span
        className={clsx('text-sm font-medium', {
          'text-primary-700': isSelected,
          'text-gray-700': !isSelected && !disabled,
          'text-gray-400': disabled,
        })}
      >
        {label}
      </span>
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

export interface DeviceTypeSelectorProps {
  /** The currently selected device type */
  value?: DeviceType | null;
  /** Change handler */
  onChange?: (deviceType: DeviceType) => void;
  /** List of device types to show (defaults to all) */
  deviceTypes?: DeviceType[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * DeviceTypeSelector Component
 * A grid of device type cards for selection
 */
export function DeviceTypeSelector({
  value,
  onChange,
  deviceTypes = Object.values(DeviceType),
  disabled = false,
  className,
}: DeviceTypeSelectorProps) {
  return (
    <div
      className={clsx(
        'grid grid-cols-2 sm:grid-cols-3 gap-3',
        className
      )}
      role="group"
      aria-label="اختر نوع الجهاز"
    >
      {deviceTypes.map((deviceType) => (
        <DeviceTypeCard
          key={deviceType}
          deviceType={deviceType}
          isSelected={value === deviceType}
          onClick={onChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export default DeviceTypeCard;
