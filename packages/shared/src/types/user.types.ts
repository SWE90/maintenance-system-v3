/**
 * User Role Enum
 * Defines all possible user roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
  CUSTOMER = 'customer',
  WORKSHOP = 'workshop',
}

/**
 * User Status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Base User Interface
 */
export interface IUser {
  id: number;
  email: string | null;
  phone: string | null;
  name: string;
  nameAr: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff User (Admin, Supervisor, Technician)
 */
export interface IStaffUser extends IUser {
  email: string;
  role: UserRole.ADMIN | UserRole.SUPERVISOR | UserRole.TECHNICIAN | UserRole.WORKSHOP;
  employeeId: string | null;
  department: string | null;
}

/**
 * Customer User
 */
export interface ICustomerUser extends IUser {
  phone: string;
  role: UserRole.CUSTOMER;
  address: string | null;
  city: string | null;
  district: string | null;
}

/**
 * Technician Extended Info
 */
export interface ITechnician extends IStaffUser {
  role: UserRole.TECHNICIAN;
  specializations: string[];
  isAvailable: boolean;
  currentLocation: {
    lat: number;
    lng: number;
    updatedAt: Date;
  } | null;
  activeTaskId: number | null;
  completedTasksToday: number;
}

/**
 * Auth Token Payload
 */
export interface ITokenPayload {
  sub: number;
  email: string | null;
  phone: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Auth Response
 */
export interface IAuthResponse {
  user: Omit<IUser, 'createdAt' | 'updatedAt'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * OTP Request
 */
export interface IOtpRequest {
  phone: string;
}

/**
 * OTP Verify Request
 */
export interface IOtpVerifyRequest {
  phone: string;
  code: string;
}
