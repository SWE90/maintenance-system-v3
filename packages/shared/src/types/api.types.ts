/**
 * Standard API Response Wrapper
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: IResponseMeta;
}

/**
 * Paginated Response
 */
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  meta: IPaginationMeta;
}

/**
 * Response Meta
 */
export interface IResponseMeta {
  timestamp: string;
  path: string;
  duration?: number;
}

/**
 * Pagination Meta
 */
export interface IPaginationMeta extends IResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Error Response
 */
export interface IErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    stack?: string;
  };
  meta: IResponseMeta;
}

/**
 * Error Codes
 */
export enum ErrorCode {
  // Auth Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // FSM Errors
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  TRANSITION_BLOCKED = 'TRANSITION_BLOCKED',
  TECHNICIAN_REQUIRED = 'TECHNICIAN_REQUIRED',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate Limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

/**
 * Query Params for pagination
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter Query
 */
export interface IFilterQuery extends IPaginationQuery {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
}

/**
 * Task Filter Query
 */
export interface ITaskFilterQuery extends IFilterQuery {
  technicianId?: number;
  customerId?: number;
  priority?: string;
  type?: string;
  city?: string;
}

/**
 * WebSocket Events
 */
export enum WsEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Tracking
  LOCATION_UPDATE = 'location:update',
  LOCATION_SUBSCRIBE = 'location:subscribe',
  LOCATION_UNSUBSCRIBE = 'location:unsubscribe',

  // Task Updates
  TASK_UPDATE = 'task:update',
  TASK_SUBSCRIBE = 'task:subscribe',
  TASK_UNSUBSCRIBE = 'task:unsubscribe',

  // Notifications
  NOTIFICATION = 'notification',
}

/**
 * WebSocket Location Payload
 */
export interface IWsLocationPayload {
  technicianId: number;
  taskId: number | null;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

/**
 * WebSocket Task Update Payload
 */
export interface IWsTaskUpdatePayload {
  taskId: number;
  status: string;
  previousStatus: string;
  updatedBy: number;
  timestamp: string;
}
