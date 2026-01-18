'use client';

import { DeviceType } from '@maintenance/shared';
import {
  Wind,
  CircleDot,
  Refrigerator,
  Flame,
  Waves,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export interface DeviceIconProps {
  /** The device type */
  deviceType: DeviceType;
  /** Optional additional CSS classes */
  className?: string;
  /** Icon size */
  size?: number;
}

// Map device types to icons
const deviceIcons: Record<DeviceType, LucideIcon> = {
  [DeviceType.AC]: Wind,
  [DeviceType.WASHER]: CircleDot,
  [DeviceType.FRIDGE]: Refrigerator,
  [DeviceType.OVEN]: Flame,
  [DeviceType.DISHWASHER]: Waves,
  [DeviceType.OTHER]: HelpCircle,
};

/**
 * DeviceIcon Component
 * Renders the appropriate Lucide icon for a device type
 */
export function DeviceIcon({
  deviceType,
  className,
  size,
}: DeviceIconProps) {
  const Icon = deviceIcons[deviceType] || HelpCircle;
  return <Icon className={className} size={size} />;
}

export default DeviceIcon;
