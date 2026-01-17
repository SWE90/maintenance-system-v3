/**
 * Task Status Enum - FSM States
 * Defines all possible states in the technician workflow
 */
export enum TaskStatus {
  // Initial States
  PENDING = 'pending',           // تذكرة جديدة - بانتظار القبول
  ACCEPTED = 'accepted',         // تم القبول - بانتظار الجدولة
  SCHEDULED = 'scheduled',       // تمت الجدولة - بانتظار البدء

  // In Progress States
  ON_ROUTE = 'on_route',         // الفني في الطريق
  ARRIVED = 'arrived',           // الفني وصل
  INSPECTING = 'inspecting',     // جاري الفحص
  REPAIRING = 'repairing',       // جاري الإصلاح
  WAITING_PARTS = 'waiting_parts', // بانتظار قطع الغيار

  // Terminal States
  COMPLETED = 'completed',       // تم الإنجاز
  NOT_REPAIRED = 'not_repaired', // لم يتم الإصلاح
  CANCELLED = 'cancelled',       // ملغاة
}

/**
 * Task Priority
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task Type
 */
export enum TaskType {
  INSTALLATION = 'installation',   // تركيب
  MAINTENANCE = 'maintenance',     // صيانة
  REPAIR = 'repair',               // إصلاح
  INSPECTION = 'inspection',       // فحص
  WARRANTY = 'warranty',           // ضمان
}

/**
 * Stage Type - للتتبع الزمني
 */
export enum StageType {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  SCHEDULED = 'scheduled',
  DISPATCHED = 'dispatched',
  ON_ROUTE = 'on_route',
  ARRIVED = 'arrived',
  INSPECTING = 'inspecting',
  REPAIRING = 'repairing',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  NOT_REPAIRED = 'not_repaired',
  CANCELLED = 'cancelled',
}

/**
 * FSM Transition Definition
 */
export interface IFsmTransition {
  from: TaskStatus;
  to: TaskStatus[];
  requiredRole?: string[];
  requiresTechnician?: boolean;
  requiresVerification?: boolean;
  requiresNotes?: boolean;
}

/**
 * Task Interface
 */
export interface ITask {
  id: number;
  ticketNumber: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;

  // Customer Info
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerDistrict: string;
  customerLat: number | null;
  customerLng: number | null;

  // Assignment
  technicianId: number | null;
  technicianName: string | null;
  supervisorId: number | null;

  // Scheduling
  scheduledDate: Date | null;
  scheduledTime: string | null;

  // Product Info
  productType: string | null;
  productModel: string | null;
  productSerial: string | null;
  warrantyStatus: string | null;

  // Work Details
  issueDescription: string;
  inspectionNotes: string | null;
  repairNotes: string | null;
  completionNotes: string | null;
  partsUsed: string | null;

  // Verification
  verificationCode: string | null;
  verificationCodeSentAt: Date | null;

  // Tracking
  trackingToken: string | null;
  trackingTokenExpiresAt: Date | null;

  // Odoo Integration
  odooOrderId: number | null;
  odooSynced: boolean;
  odooSyncedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  acceptedAt: Date | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Task Stage - لتتبع الأوقات
 */
export interface ITaskStage {
  id: number;
  taskId: number;
  stageType: StageType;
  performedBy: number;
  notes: string | null;
  createdAt: Date;
}

/**
 * Time Log - لحساب KPIs
 */
export interface ITimeLog {
  id: number;
  taskId: number;
  stageType: StageType;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  performedBy: number;
}

/**
 * Task Create DTO
 */
export interface ITaskCreate {
  customerId: number;
  type: TaskType;
  priority?: TaskPriority;
  issueDescription: string;
  productType?: string;
  productModel?: string;
  productSerial?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
}

/**
 * Task Transition DTO
 */
export interface ITaskTransition {
  taskId: number;
  toStatus: TaskStatus;
  notes?: string;
  verificationCode?: string;
  partsUsed?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Transition Result
 */
export interface ITransitionResult {
  success: boolean;
  task: ITask;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  stage: ITaskStage;
  error?: string;
}
