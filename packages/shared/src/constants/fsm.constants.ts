import { TicketStatus, IFsmTransition } from '../types/task.types';
import { UserRole } from '../types/user.types';

/**
 * FSM Transitions Map
 * Defines all valid state transitions with requirements
 */
export const FSM_TRANSITIONS: Record<TicketStatus, IFsmTransition> = {
  // ============================================
  // Initial States
  // ============================================
  [TicketStatus.NEW]: {
    from: TicketStatus.NEW,
    to: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPERVISOR],
  },

  [TicketStatus.ASSIGNED]: {
    from: TicketStatus.ASSIGNED,
    to: [TicketStatus.SCHEDULED, TicketStatus.CANCELLED],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TicketStatus.SCHEDULED]: {
    from: TicketStatus.SCHEDULED,
    to: [TicketStatus.ON_ROUTE, TicketStatus.CANCELLED],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  // ============================================
  // In Progress States
  // ============================================
  [TicketStatus.ON_ROUTE]: {
    from: TicketStatus.ON_ROUTE,
    to: [TicketStatus.ARRIVED],
    allowedRoles: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TicketStatus.ARRIVED]: {
    from: TicketStatus.ARRIVED,
    to: [TicketStatus.INSPECTING],
    allowedRoles: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TicketStatus.INSPECTING]: {
    from: TicketStatus.INSPECTING,
    to: [TicketStatus.DIAGNOSED],
    allowedRoles: [UserRole.TECHNICIAN],
    requiresTechnician: true,
    requiresPhotos: true,
    minPhotos: 1,
  },

  [TicketStatus.DIAGNOSED]: {
    from: TicketStatus.DIAGNOSED,
    to: [
      TicketStatus.REPAIRING,
      TicketStatus.WAITING_PARTS,
      TicketStatus.NOT_FIXED,
      TicketStatus.PICKUP_DEVICE,
    ],
    allowedRoles: [UserRole.TECHNICIAN],
    requiresTechnician: true,
    requiresNotes: true,
  },

  [TicketStatus.REPAIRING]: {
    from: TicketStatus.REPAIRING,
    to: [
      TicketStatus.COMPLETED,
      TicketStatus.WAITING_PARTS,
      TicketStatus.NOT_FIXED,
    ],
    allowedRoles: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TicketStatus.WAITING_PARTS]: {
    from: TicketStatus.WAITING_PARTS,
    to: [TicketStatus.REPAIRING, TicketStatus.NOT_FIXED, TicketStatus.CANCELLED],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN],
  },

  // ============================================
  // Workshop Flow
  // ============================================
  [TicketStatus.PICKUP_DEVICE]: {
    from: TicketStatus.PICKUP_DEVICE,
    to: [TicketStatus.IN_WORKSHOP],
    allowedRoles: [UserRole.WORKSHOP, UserRole.ADMIN],
    requiresNotes: true,
  },

  [TicketStatus.IN_WORKSHOP]: {
    from: TicketStatus.IN_WORKSHOP,
    to: [TicketStatus.READY_DELIVERY, TicketStatus.NOT_FIXED],
    allowedRoles: [UserRole.WORKSHOP, UserRole.ADMIN],
  },

  [TicketStatus.READY_DELIVERY]: {
    from: TicketStatus.READY_DELIVERY,
    to: [TicketStatus.COMPLETED],
    allowedRoles: [UserRole.TECHNICIAN, UserRole.WORKSHOP],
    requiresCustomerConfirmation: true,
  },

  // ============================================
  // Terminal States
  // ============================================
  [TicketStatus.COMPLETED]: {
    from: TicketStatus.COMPLETED,
    to: [], // Terminal state
    requiresPhotos: true,
    minPhotos: 3,
    requiresCustomerConfirmation: true,
  },

  [TicketStatus.NOT_FIXED]: {
    from: TicketStatus.NOT_FIXED,
    to: [], // Terminal state
    requiresNotes: true,
  },

  [TicketStatus.CANCELLED]: {
    from: TicketStatus.CANCELLED,
    to: [], // Terminal state
    requiresNotes: true,
  },
};

/**
 * Get valid transitions from a status
 */
export function getValidTransitions(currentStatus: TicketStatus): TicketStatus[] {
  return FSM_TRANSITIONS[currentStatus]?.to || [];
}

/**
 * Check if transition is valid
 */
export function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  const transitions = FSM_TRANSITIONS[from];
  return transitions?.to.includes(to) || false;
}

/**
 * Get transition requirements
 */
export function getTransitionRequirements(from: TicketStatus, to: TicketStatus): {
  requiresTechnician: boolean;
  requiresPhotos: boolean;
  requiresNotes: boolean;
  requiresCustomerConfirmation: boolean;
  minPhotos: number;
  allowedRoles: string[];
} | null {
  const transition = FSM_TRANSITIONS[from];
  if (!transition || !transition.to.includes(to)) {
    return null;
  }

  return {
    requiresTechnician: transition.requiresTechnician || false,
    requiresPhotos: transition.requiresPhotos || false,
    requiresNotes: transition.requiresNotes || false,
    requiresCustomerConfirmation: transition.requiresCustomerConfirmation || false,
    minPhotos: transition.minPhotos || 0,
    allowedRoles: transition.allowedRoles || [],
  };
}

/**
 * Check if user role can perform transition
 */
export function canRolePerformTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: UserRole
): boolean {
  const transition = FSM_TRANSITIONS[from];
  if (!transition || !transition.to.includes(to)) {
    return false;
  }

  // If no role restriction, allow all
  if (!transition.allowedRoles || transition.allowedRoles.length === 0) {
    return true;
  }

  return transition.allowedRoles.includes(role);
}

/**
 * Terminal statuses - cannot transition from these
 */
export const TERMINAL_STATUSES: TicketStatus[] = [
  TicketStatus.COMPLETED,
  TicketStatus.NOT_FIXED,
  TicketStatus.CANCELLED,
];

/**
 * Active statuses - tasks in progress
 */
export const ACTIVE_STATUSES: TicketStatus[] = [
  TicketStatus.ON_ROUTE,
  TicketStatus.ARRIVED,
  TicketStatus.INSPECTING,
  TicketStatus.DIAGNOSED,
  TicketStatus.REPAIRING,
  TicketStatus.IN_WORKSHOP,
];

/**
 * Pending statuses - waiting for action
 */
export const PENDING_STATUSES: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.ASSIGNED,
  TicketStatus.SCHEDULED,
  TicketStatus.WAITING_PARTS,
  TicketStatus.PICKUP_DEVICE,
  TicketStatus.READY_DELIVERY,
];

/**
 * Workshop statuses
 */
export const WORKSHOP_STATUSES: TicketStatus[] = [
  TicketStatus.PICKUP_DEVICE,
  TicketStatus.IN_WORKSHOP,
  TicketStatus.READY_DELIVERY,
];

/**
 * Status labels in Arabic
 */
export const STATUS_LABELS_AR: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'جديدة',
  [TicketStatus.ASSIGNED]: 'تم الإسناد',
  [TicketStatus.SCHEDULED]: 'مجدولة',
  [TicketStatus.ON_ROUTE]: 'في الطريق',
  [TicketStatus.ARRIVED]: 'وصل الموقع',
  [TicketStatus.INSPECTING]: 'جاري الفحص',
  [TicketStatus.DIAGNOSED]: 'تم التشخيص',
  [TicketStatus.REPAIRING]: 'جاري الإصلاح',
  [TicketStatus.WAITING_PARTS]: 'بانتظار القطع',
  [TicketStatus.PICKUP_DEVICE]: 'سحب الجهاز',
  [TicketStatus.IN_WORKSHOP]: 'في الورشة',
  [TicketStatus.READY_DELIVERY]: 'جاهز للتسليم',
  [TicketStatus.COMPLETED]: 'مكتملة',
  [TicketStatus.NOT_FIXED]: 'لم يتم الإصلاح',
  [TicketStatus.CANCELLED]: 'ملغاة',
};

/**
 * Status labels in English
 */
export const STATUS_LABELS_EN: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'New',
  [TicketStatus.ASSIGNED]: 'Assigned',
  [TicketStatus.SCHEDULED]: 'Scheduled',
  [TicketStatus.ON_ROUTE]: 'On Route',
  [TicketStatus.ARRIVED]: 'Arrived',
  [TicketStatus.INSPECTING]: 'Inspecting',
  [TicketStatus.DIAGNOSED]: 'Diagnosed',
  [TicketStatus.REPAIRING]: 'Repairing',
  [TicketStatus.WAITING_PARTS]: 'Waiting Parts',
  [TicketStatus.PICKUP_DEVICE]: 'Device Pickup',
  [TicketStatus.IN_WORKSHOP]: 'In Workshop',
  [TicketStatus.READY_DELIVERY]: 'Ready for Delivery',
  [TicketStatus.COMPLETED]: 'Completed',
  [TicketStatus.NOT_FIXED]: 'Not Fixed',
  [TicketStatus.CANCELLED]: 'Cancelled',
};

/**
 * Customer-friendly status labels in Arabic
 */
export const CUSTOMER_STATUS_LABELS_AR: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'تم استلام طلبك',
  [TicketStatus.ASSIGNED]: 'تم تعيين فني لطلبك',
  [TicketStatus.SCHEDULED]: 'تم تحديد موعد الزيارة',
  [TicketStatus.ON_ROUTE]: 'الفني في الطريق إليك',
  [TicketStatus.ARRIVED]: 'الفني وصل',
  [TicketStatus.INSPECTING]: 'جاري فحص الجهاز',
  [TicketStatus.DIAGNOSED]: 'تم تحديد المشكلة',
  [TicketStatus.REPAIRING]: 'جاري إصلاح الجهاز',
  [TicketStatus.WAITING_PARTS]: 'بانتظار قطع الغيار',
  [TicketStatus.PICKUP_DEVICE]: 'تم سحب الجهاز للورشة',
  [TicketStatus.IN_WORKSHOP]: 'الجهاز في الورشة',
  [TicketStatus.READY_DELIVERY]: 'جاهز للتسليم',
  [TicketStatus.COMPLETED]: 'تم الإصلاح بنجاح',
  [TicketStatus.NOT_FIXED]: 'تعذر الإصلاح',
  [TicketStatus.CANCELLED]: 'تم إلغاء الطلب',
};

/**
 * Status colors for UI (Tailwind classes)
 */
export const STATUS_COLORS: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'blue',
  [TicketStatus.ASSIGNED]: 'indigo',
  [TicketStatus.SCHEDULED]: 'purple',
  [TicketStatus.ON_ROUTE]: 'yellow',
  [TicketStatus.ARRIVED]: 'orange',
  [TicketStatus.INSPECTING]: 'cyan',
  [TicketStatus.DIAGNOSED]: 'teal',
  [TicketStatus.REPAIRING]: 'sky',
  [TicketStatus.WAITING_PARTS]: 'amber',
  [TicketStatus.PICKUP_DEVICE]: 'pink',
  [TicketStatus.IN_WORKSHOP]: 'fuchsia',
  [TicketStatus.READY_DELIVERY]: 'lime',
  [TicketStatus.COMPLETED]: 'green',
  [TicketStatus.NOT_FIXED]: 'red',
  [TicketStatus.CANCELLED]: 'gray',
};

/**
 * Status badge classes for UI
 */
export const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'bg-blue-100 text-blue-800',
  [TicketStatus.ASSIGNED]: 'bg-indigo-100 text-indigo-800',
  [TicketStatus.SCHEDULED]: 'bg-purple-100 text-purple-800',
  [TicketStatus.ON_ROUTE]: 'bg-yellow-100 text-yellow-800',
  [TicketStatus.ARRIVED]: 'bg-orange-100 text-orange-800',
  [TicketStatus.INSPECTING]: 'bg-cyan-100 text-cyan-800',
  [TicketStatus.DIAGNOSED]: 'bg-teal-100 text-teal-800',
  [TicketStatus.REPAIRING]: 'bg-sky-100 text-sky-800',
  [TicketStatus.WAITING_PARTS]: 'bg-amber-100 text-amber-800',
  [TicketStatus.PICKUP_DEVICE]: 'bg-pink-100 text-pink-800',
  [TicketStatus.IN_WORKSHOP]: 'bg-fuchsia-100 text-fuchsia-800',
  [TicketStatus.READY_DELIVERY]: 'bg-lime-100 text-lime-800',
  [TicketStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TicketStatus.NOT_FIXED]: 'bg-red-100 text-red-800',
  [TicketStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
};

/**
 * Priority labels in Arabic
 */
export const PRIORITY_LABELS_AR: Record<string, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

/**
 * Priority badge classes
 */
export const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

/**
 * Device type labels in Arabic
 */
export const DEVICE_TYPE_LABELS_AR: Record<string, string> = {
  ac: 'مكيف',
  washer: 'غسالة',
  fridge: 'ثلاجة',
  oven: 'فرن',
  dishwasher: 'غسالة صحون',
  other: 'أخرى',
};

/**
 * Device type icons (Lucide icon names)
 */
export const DEVICE_TYPE_ICONS: Record<string, string> = {
  ac: 'Wind',
  washer: 'CircleDot',
  fridge: 'Refrigerator',
  oven: 'Flame',
  dishwasher: 'Waves',
  other: 'HelpCircle',
};

/**
 * Time slot labels in Arabic
 */
export const TIME_SLOT_LABELS_AR: Record<string, string> = {
  morning: 'صباحاً (8-12)',
  noon: 'ظهراً (12-5)',
  evening: 'مساءً (5-11)',
};

/**
 * Warranty status labels in Arabic
 */
export const WARRANTY_STATUS_LABELS_AR: Record<string, string> = {
  yes: 'نعم',
  no: 'لا',
  unknown: 'لا أعلم',
};

/**
 * Not fixed reasons in Arabic
 */
export const NOT_FIXED_REASONS_AR: string[] = [
  'العميل غير متواجد',
  'العميل رفض التكلفة',
  'خارج نطاق الخدمة',
  'الجهاز غير قابل للإصلاح',
  'قطع الغيار غير متوفرة',
  'مشكلة في التيار الكهربائي',
  'العميل ألغى الطلب',
  'أخرى',
];

// Re-export for backwards compatibility
export const TaskStatus = TicketStatus;
