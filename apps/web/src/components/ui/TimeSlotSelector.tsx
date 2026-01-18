'use client';

import { TimeSlot, TIME_SLOT_LABELS_AR } from '@maintenance/shared';
import { clsx } from 'clsx';
import { Sun, SunMedium, Moon } from 'lucide-react';

export interface TimeSlotSelectorProps {
  /** The currently selected time slot */
  value?: TimeSlot | null;
  /** Change handler */
  onChange?: (timeSlot: TimeSlot) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Optional additional CSS classes */
  className?: string;
  /** Form field name for accessibility */
  name?: string;
}

interface TimeSlotOption {
  value: TimeSlot;
  label: string;
  icon: typeof Sun;
  timeRange: string;
  iconColor: string;
}

const timeSlotOptions: TimeSlotOption[] = [
  {
    value: TimeSlot.MORNING,
    label: TIME_SLOT_LABELS_AR[TimeSlot.MORNING] || 'صباحاً (8-12)',
    icon: Sun,
    timeRange: '8:00 - 12:00',
    iconColor: 'text-yellow-500',
  },
  {
    value: TimeSlot.NOON,
    label: TIME_SLOT_LABELS_AR[TimeSlot.NOON] || 'ظهراً (12-5)',
    icon: SunMedium,
    timeRange: '12:00 - 17:00',
    iconColor: 'text-orange-500',
  },
  {
    value: TimeSlot.EVENING,
    label: TIME_SLOT_LABELS_AR[TimeSlot.EVENING] || 'مساءً (5-11)',
    icon: Moon,
    timeRange: '17:00 - 23:00',
    iconColor: 'text-indigo-500',
  },
];

/**
 * TimeSlotSelector Component
 * Radio buttons for selecting preferred time slots (morning/noon/evening)
 */
export function TimeSlotSelector({
  value,
  onChange,
  disabled = false,
  layout = 'vertical',
  className,
  name = 'timeSlot',
}: TimeSlotSelectorProps) {
  const handleChange = (timeSlot: TimeSlot) => {
    if (!disabled && onChange) {
      onChange(timeSlot);
    }
  };

  return (
    <div
      className={clsx(
        'flex gap-3',
        {
          'flex-col': layout === 'vertical',
          'flex-row flex-wrap': layout === 'horizontal',
        },
        className
      )}
      role="radiogroup"
      aria-label="اختر الوقت المفضل"
    >
      {timeSlotOptions.map((option) => {
        const isSelected = value === option.value;
        const IconComponent = option.icon;

        return (
          <label
            key={option.value}
            className={clsx(
              'relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
              {
                // Selected state
                'border-primary-500 bg-primary-50': isSelected,
                // Unselected state
                'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50':
                  !isSelected && !disabled,
                // Disabled state
                'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60': disabled,
              },
              layout === 'horizontal' ? 'flex-1 min-w-[140px]' : ''
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => handleChange(option.value)}
              disabled={disabled}
              className="sr-only"
              aria-label={option.label}
            />

            {/* Custom radio indicator */}
            <div
              className={clsx(
                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                {
                  'border-primary-500 bg-primary-500': isSelected,
                  'border-gray-300': !isSelected,
                }
              )}
            >
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>

            {/* Icon */}
            <IconComponent
              size={24}
              className={clsx(
                'flex-shrink-0',
                isSelected ? option.iconColor : 'text-gray-400'
              )}
            />

            {/* Label and time range */}
            <div className="flex flex-col">
              <span
                className={clsx('font-medium', {
                  'text-primary-700': isSelected,
                  'text-gray-700': !isSelected,
                })}
              >
                {option.label.split('(')[0].trim()}
              </span>
              <span
                className={clsx('text-sm', {
                  'text-primary-600': isSelected,
                  'text-gray-500': !isSelected,
                })}
              >
                {option.timeRange}
              </span>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-2 left-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}

export default TimeSlotSelector;
