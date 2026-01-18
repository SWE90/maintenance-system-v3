/**
 * V3 Maintenance System - Shared UI Components
 *
 * This module exports all shared UI components for the maintenance system.
 * All components are designed with:
 * - RTL support (Arabic-first)
 * - TailwindCSS styling
 * - TypeScript type safety
 * - Accessibility (ARIA labels)
 */

// Badge Components
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

export { PriorityBadge } from './PriorityBadge';
export type { PriorityBadgeProps } from './PriorityBadge';

// Selection Components
export { DeviceTypeCard, DeviceTypeSelector } from './DeviceTypeCard';
export type { DeviceTypeCardProps, DeviceTypeSelectorProps } from './DeviceTypeCard';

export { TimeSlotSelector } from './TimeSlotSelector';
export type { TimeSlotSelectorProps } from './TimeSlotSelector';

// Wizard Components
export { StepIndicator, DEFAULT_WIZARD_STEPS } from './StepIndicator';
export type { StepIndicatorProps, Step } from './StepIndicator';

// Map Components
export { MapPicker } from './MapPicker';
export type { MapPickerProps, LatLng } from './MapPicker';

// Upload Components
export { PhotoUploader } from './PhotoUploader';
export type { PhotoUploaderProps, PhotoFile } from './PhotoUploader';
