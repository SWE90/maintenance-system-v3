/**
 * Ticket Status Enum - FSM States
 * Defines all possible states in the technician workflow
 */
export enum TicketStatus {
  // Initial States
  NEW = 'new',                       // تذكرة جديدة
  ASSIGNED = 'assigned',             // تم الإسناد
  SCHEDULED = 'scheduled',           // مجدولة

  // In Progress States
  ON_ROUTE = 'on_route',             // في الطريق
  ARRIVED = 'arrived',               // وصل الموقع
  INSPECTING = 'inspecting',         // جاري الفحص
  DIAGNOSED = 'diagnosed',           // تم التشخيص
  REPAIRING = 'repairing',           // جاري الإصلاح
  WAITING_PARTS = 'waiting_parts',   // بانتظار قطع الغيار

  // Workshop Flow
  PICKUP_DEVICE = 'pickup_device',   // سحب الجهاز
  IN_WORKSHOP = 'in_workshop',       // في الورشة
  READY_DELIVERY = 'ready_delivery', // جاهز للتسليم

  // Terminal States
  COMPLETED = 'completed',           // مكتملة
  NOT_FIXED = 'not_fixed',           // لم يتم الإصلاح
  CANCELLED = 'cancelled',           // ملغاة
}

// Alias for backwards compatibility
export const TaskStatus = TicketStatus;
export type TaskStatus = TicketStatus;

/**
 * Priority
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Alias
export const TaskPriority = Priority;
export type TaskPriority = Priority;

/**
 * Device Type
 */
export enum DeviceType {
  AC = 'ac',                         // مكيف
  WASHER = 'washer',                 // غسالة
  FRIDGE = 'fridge',                 // ثلاجة
  OVEN = 'oven',                     // فرن
  DISHWASHER = 'dishwasher',         // غسالة صحون
  OTHER = 'other',                   // أخرى
}

/**
 * Warranty Status
 */
export enum WarrantyStatus {
  YES = 'yes',
  NO = 'no',
  UNKNOWN = 'unknown',
}

/**
 * Time Slot
 */
export enum TimeSlot {
  MORNING = 'morning',   // 8-12
  NOON = 'noon',         // 12-17
  EVENING = 'evening',   // 17-23
}

/**
 * Attachment Type
 */
export enum AttachmentType {
  BEFORE_INSPECTION = 'before_inspection',
  AFTER_REPAIR = 'after_repair',
  SERIAL_PHOTO = 'serial_photo',
  INVOICE_PHOTO = 'invoice_photo',
  PARTS_PHOTO = 'parts_photo',
  DEVICE_PHOTO = 'device_photo',
  SIGNATURE = 'signature',
  OTHER = 'other',
}

/**
 * Message Channel
 */
export enum MessageChannel {
  INTERNAL = 'internal',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

/**
 * Message Status
 */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Parts Request Status
 */
export enum PartsRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

/**
 * Escalation Level
 */
export enum EscalationLevel {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
}

/**
 * Escalation Type
 */
export enum EscalationType {
  ASSIGNMENT_DELAY = 'assignment_delay',
  SCHEDULE_DELAY = 'schedule_delay',
  TRIP_DELAY = 'trip_delay',
  ARRIVAL_DELAY = 'arrival_delay',
  PARTS_DELAY = 'parts_delay',
  COMPLETION_DELAY = 'completion_delay',
  CUSTOMER_COMPLAINT = 'customer_complaint',
  SLA_BREACH = 'sla_breach',
}

/**
 * FSM Transition Definition
 */
export interface IFsmTransition {
  from: TicketStatus;
  to: TicketStatus[];
  allowedRoles?: string[];
  requiresTechnician?: boolean;
  requiresPhotos?: boolean;
  requiresNotes?: boolean;
  requiresCustomerConfirmation?: boolean;
  minPhotos?: number;
}

/**
 * Ticket Interface (matches Prisma schema)
 */
export interface ITicket {
  id: number;
  ticketNumber: string;
  trackingToken: string;

  // Customer Info
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerCity: string;
  customerAddress: string;
  latitude: number;
  longitude: number;

  // Device Info
  deviceType: DeviceType;
  brand: string;
  model?: string | null;
  problemDescription: string;

  // Warranty Info
  warrantyStatus: WarrantyStatus;
  invoiceNumber?: string | null;
  serialNumber?: string | null;

  // Scheduling
  preferredTimeSlot?: TimeSlot | null;
  scheduledDate?: Date | null;
  scheduledTimeSlot?: TimeSlot | null;

  // Assignment
  technicianId?: number | null;
  technicianName?: string | null;
  assignedAt?: Date | null;
  assignedById?: number | null;

  // Status & Priority
  status: TicketStatus;
  priority: Priority;

  // Notes
  diagnosisNotes?: string | null;
  repairNotes?: string | null;
  internalNotes?: string | null;

  // Completion Info
  completedSuccessfully?: boolean | null;
  notFixedReasons?: string[];
  cancellationReason?: string | null;

  // Customer Confirmation
  customerSignature?: string | null;
  customerOtpVerified: boolean;
  customerRating?: number | null;
  customerFeedback?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  scheduledSetAt?: Date | null;
  tripStartedAt?: Date | null;
  arrivedAt?: Date | null;
  inspectionStartedAt?: Date | null;
  diagnosedAt?: Date | null;
  repairStartedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

// Alias for backwards compatibility
export type ITask = ITicket;

/**
 * Ticket Status History Entry
 */
export interface ITicketStatusHistory {
  id: number;
  ticketId: number;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  notes?: string | null;
  actorId?: number | null;
  actorName: string;
  actorRole: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
}

// Alias
export type ITaskStage = ITicketStatusHistory;

/**
 * Ticket Attachment
 */
export interface ITicketAttachment {
  id: number;
  ticketId: number;
  type: AttachmentType;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedById: number;
  uploadedByName: string;
  createdAt: Date;
}

/**
 * Ticket Message
 */
export interface ITicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  channel: MessageChannel;
  externalId?: string | null;
  status: MessageStatus;
  readAt?: Date | null;
  createdAt: Date;
}

/**
 * Parts Request
 */
export interface IPartsRequest {
  id: number;
  ticketId: number;
  partName: string;
  partNumber?: string | null;
  quantity: number;
  notes?: string | null;
  photos: string[];
  status: PartsRequestStatus;
  requestedById: number;
  requestedByName: string;
  requestedAt: Date;
  approvedAt?: Date | null;
  approvedById?: number | null;
  orderedAt?: Date | null;
  receivedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
}

/**
 * Escalation
 */
export interface IEscalation {
  id: number;
  ticketId: number;
  level: EscalationLevel;
  type: EscalationType;
  reason: string;
  ownerId?: number | null;
  ownerName?: string | null;
  isResolved: boolean;
  resolvedAt?: Date | null;
  resolvedById?: number | null;
  resolvedByName?: string | null;
  resolutionNotes?: string | null;
  createdAt: Date;
}

/**
 * Time Log - for KPI calculation
 */
export interface ITimeLog {
  id: number;
  ticketId: number;
  technicianId?: number | null;
  stage: TicketStatus;
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes?: number | null;
}

/**
 * Rating
 */
export interface IRating {
  id: number;
  ticketId: number;
  customerId: number;
  technicianId?: number | null;
  score: number;
  feedback?: string | null;
  createdAt: Date;
}

/**
 * Ticket Create DTO (Customer submission)
 */
export interface ITicketCreate {
  // Customer Info
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  latitude: number;
  longitude: number;

  // Device Info
  deviceType: DeviceType;
  brand: string;
  model?: string;
  problemDescription: string;

  // Scheduling
  preferredTimeSlot?: TimeSlot;

  // Warranty
  warrantyStatus: WarrantyStatus;
  invoiceNumber?: string;
  serialNumber?: string;
}

/**
 * Ticket Transition DTO
 */
export interface ITicketTransition {
  ticketId: number;
  toStatus: TicketStatus;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Start Inspection DTO
 */
export interface IStartInspectionDto {
  ticketId: number;
  photos: string[]; // URLs of uploaded photos (min 1)
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Complete Diagnosis DTO
 */
export interface ICompleteDiagnosisDto {
  ticketId: number;
  diagnosisNotes: string;
  checklist?: Record<string, boolean>;
}

/**
 * Request Parts DTO
 */
export interface IRequestPartsDto {
  ticketId: number;
  partName: string;
  partNumber?: string;
  quantity?: number;
  notes?: string;
  serialPhotos: string[]; // Required min 1
  additionalPhotos?: string[];
}

/**
 * Not Fixed DTO
 */
export interface INotFixedDto {
  ticketId: number;
  reasons: string[]; // Must have at least 1
  notes?: string;
  evidencePhoto?: string;
}

/**
 * Pickup Device DTO
 */
export interface IPickupDeviceDto {
  ticketId: number;
  reason: string;
  photos?: string[];
  customerAcknowledged: boolean;
}

/**
 * Complete Repair DTO
 */
export interface ICompleteRepairDto {
  ticketId: number;
  photos: string[]; // Required min 3
  notes?: string;
  confirmationType: 'signature' | 'otp';
  signature?: string; // Base64 if signature
  otp?: string; // OTP code if otp
  customerRating?: number;
  customerFeedback?: string;
}

/**
 * Transition Result
 */
export interface ITransitionResult {
  success: boolean;
  ticket: ITicket;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  historyEntry: ITicketStatusHistory;
  error?: string;
}

/**
 * Tracking Response (Public)
 */
export interface ITrackingResponse {
  ticket: {
    ticketNumber: string;
    status: TicketStatus;
    deviceType: DeviceType;
    brand: string;
    problemDescription: string;
    scheduledDate?: Date | null;
    scheduledTimeSlot?: TimeSlot | null;
  };
  timeline: ITicketStatusHistory[];
  technicianLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  } | null;
  estimatedArrival?: Date | null;
}
