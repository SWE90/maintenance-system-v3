import { TaskStatus, IFsmTransition } from '../types/task.types';
import { UserRole } from '../types/user.types';

/**
 * FSM Transitions Map
 * Defines all valid state transitions with requirements
 */
export const FSM_TRANSITIONS: Record<TaskStatus, IFsmTransition> = {
  [TaskStatus.PENDING]: {
    from: TaskStatus.PENDING,
    to: [TaskStatus.ACCEPTED, TaskStatus.CANCELLED],
    requiredRole: [UserRole.ADMIN, UserRole.SUPERVISOR],
  },

  [TaskStatus.ACCEPTED]: {
    from: TaskStatus.ACCEPTED,
    to: [TaskStatus.SCHEDULED, TaskStatus.CANCELLED],
    requiredRole: [UserRole.ADMIN, UserRole.SUPERVISOR],
  },

  [TaskStatus.SCHEDULED]: {
    from: TaskStatus.SCHEDULED,
    to: [TaskStatus.ON_ROUTE, TaskStatus.CANCELLED],
    requiredRole: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TaskStatus.ON_ROUTE]: {
    from: TaskStatus.ON_ROUTE,
    to: [TaskStatus.ARRIVED],
    requiredRole: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TaskStatus.ARRIVED]: {
    from: TaskStatus.ARRIVED,
    to: [TaskStatus.INSPECTING],
    requiredRole: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TaskStatus.INSPECTING]: {
    from: TaskStatus.INSPECTING,
    to: [TaskStatus.REPAIRING, TaskStatus.NOT_REPAIRED, TaskStatus.WAITING_PARTS],
    requiredRole: [UserRole.TECHNICIAN],
    requiresTechnician: true,
    requiresNotes: true,
  },

  [TaskStatus.REPAIRING]: {
    from: TaskStatus.REPAIRING,
    to: [TaskStatus.COMPLETED, TaskStatus.NOT_REPAIRED, TaskStatus.WAITING_PARTS],
    requiredRole: [UserRole.TECHNICIAN],
    requiresTechnician: true,
  },

  [TaskStatus.WAITING_PARTS]: {
    from: TaskStatus.WAITING_PARTS,
    to: [TaskStatus.REPAIRING, TaskStatus.NOT_REPAIRED, TaskStatus.CANCELLED],
    requiredRole: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN],
    requiresNotes: true,
  },

  [TaskStatus.COMPLETED]: {
    from: TaskStatus.COMPLETED,
    to: [], // Terminal state
    requiresVerification: true,
  },

  [TaskStatus.NOT_REPAIRED]: {
    from: TaskStatus.NOT_REPAIRED,
    to: [], // Terminal state
    requiresNotes: true,
  },

  [TaskStatus.CANCELLED]: {
    from: TaskStatus.CANCELLED,
    to: [], // Terminal state
    requiresNotes: true,
  },
};

/**
 * Get valid transitions from a status
 */
export function getValidTransitions(currentStatus: TaskStatus): TaskStatus[] {
  return FSM_TRANSITIONS[currentStatus]?.to || [];
}

/**
 * Check if transition is valid
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  const transitions = FSM_TRANSITIONS[from];
  return transitions?.to.includes(to) || false;
}

/**
 * Get transition requirements
 */
export function getTransitionRequirements(from: TaskStatus, to: TaskStatus): {
  requiresTechnician: boolean;
  requiresVerification: boolean;
  requiresNotes: boolean;
  allowedRoles: string[];
} | null {
  const transition = FSM_TRANSITIONS[from];
  if (!transition || !transition.to.includes(to)) {
    return null;
  }

  return {
    requiresTechnician: transition.requiresTechnician || false,
    requiresVerification: transition.requiresVerification || false,
    requiresNotes: transition.requiresNotes || false,
    allowedRoles: transition.requiredRole || [],
  };
}

/**
 * Terminal statuses - لا يمكن الانتقال منها
 */
export const TERMINAL_STATUSES: TaskStatus[] = [
  TaskStatus.COMPLETED,
  TaskStatus.NOT_REPAIRED,
  TaskStatus.CANCELLED,
];

/**
 * Active statuses - المهام قيد التنفيذ
 */
export const ACTIVE_STATUSES: TaskStatus[] = [
  TaskStatus.ON_ROUTE,
  TaskStatus.ARRIVED,
  TaskStatus.INSPECTING,
  TaskStatus.REPAIRING,
];

/**
 * Pending statuses - المهام المعلقة
 */
export const PENDING_STATUSES: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.ACCEPTED,
  TaskStatus.SCHEDULED,
  TaskStatus.WAITING_PARTS,
];

/**
 * Status labels in Arabic
 */
export const STATUS_LABELS_AR: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'جديدة',
  [TaskStatus.ACCEPTED]: 'مقبولة',
  [TaskStatus.SCHEDULED]: 'مجدولة',
  [TaskStatus.ON_ROUTE]: 'في الطريق',
  [TaskStatus.ARRIVED]: 'وصل الفني',
  [TaskStatus.INSPECTING]: 'جاري الفحص',
  [TaskStatus.REPAIRING]: 'جاري الإصلاح',
  [TaskStatus.WAITING_PARTS]: 'بانتظار القطع',
  [TaskStatus.COMPLETED]: 'مكتملة',
  [TaskStatus.NOT_REPAIRED]: 'لم تُصلح',
  [TaskStatus.CANCELLED]: 'ملغاة',
};

/**
 * Status labels in English
 */
export const STATUS_LABELS_EN: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pending',
  [TaskStatus.ACCEPTED]: 'Accepted',
  [TaskStatus.SCHEDULED]: 'Scheduled',
  [TaskStatus.ON_ROUTE]: 'On Route',
  [TaskStatus.ARRIVED]: 'Arrived',
  [TaskStatus.INSPECTING]: 'Inspecting',
  [TaskStatus.REPAIRING]: 'Repairing',
  [TaskStatus.WAITING_PARTS]: 'Waiting Parts',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.NOT_REPAIRED]: 'Not Repaired',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

/**
 * Status colors for UI
 */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'gray',
  [TaskStatus.ACCEPTED]: 'blue',
  [TaskStatus.SCHEDULED]: 'indigo',
  [TaskStatus.ON_ROUTE]: 'yellow',
  [TaskStatus.ARRIVED]: 'orange',
  [TaskStatus.INSPECTING]: 'purple',
  [TaskStatus.REPAIRING]: 'cyan',
  [TaskStatus.WAITING_PARTS]: 'amber',
  [TaskStatus.COMPLETED]: 'green',
  [TaskStatus.NOT_REPAIRED]: 'red',
  [TaskStatus.CANCELLED]: 'gray',
};
