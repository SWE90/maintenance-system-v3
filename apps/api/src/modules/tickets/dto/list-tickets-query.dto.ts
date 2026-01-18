import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * Ticket Status Enum (matching Prisma schema)
 */
export enum TicketStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  SCHEDULED = 'scheduled',
  ON_ROUTE = 'on_route',
  ARRIVED = 'arrived',
  INSPECTING = 'inspecting',
  DIAGNOSED = 'diagnosed',
  REPAIRING = 'repairing',
  WAITING_PARTS = 'waiting_parts',
  PICKUP_DEVICE = 'pickup_device',
  IN_WORKSHOP = 'in_workshop',
  READY_DELIVERY = 'ready_delivery',
  COMPLETED = 'completed',
  NOT_FIXED = 'not_fixed',
  CANCELLED = 'cancelled',
}

/**
 * Priority Enum (matching Prisma schema)
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Device Type Enum
 */
export enum DeviceType {
  AC = 'ac',
  WASHER = 'washer',
  FRIDGE = 'fridge',
  OVEN = 'oven',
  DISHWASHER = 'dishwasher',
  OTHER = 'other',
}

/**
 * Sort Field Options
 */
export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SCHEDULED_DATE = 'scheduledDate',
  PRIORITY = 'priority',
  STATUS = 'status',
  TICKET_NUMBER = 'ticketNumber',
}

/**
 * Sort Order
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO for listing tickets with filters, pagination, and sorting
 */
export class ListTicketsQueryDto {
  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  // Sorting
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: SortField,
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField, { message: 'Invalid sort field' })
  sortBy?: SortField = SortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Invalid sort order' })
  sortOrder?: SortOrder = SortOrder.DESC;

  // Filters
  @ApiPropertyOptional({
    description: 'Filter by ticket status',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Invalid status' })
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filter by multiple statuses (comma-separated)',
    example: 'new,assigned,scheduled',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  statuses?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: Priority,
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Invalid priority' })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Filter by device type',
    enum: DeviceType,
  })
  @IsOptional()
  @IsEnum(DeviceType, { message: 'Invalid device type' })
  deviceType?: DeviceType;

  @ApiPropertyOptional({
    description: 'Filter by technician ID',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Technician ID must be an integer' })
  technicianId?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Customer ID must be an integer' })
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Riyadh',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date (from)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format for scheduledFrom' })
  scheduledFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date (to)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format for scheduledTo' })
  scheduledTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (from)',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format for createdFrom' })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (to)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format for createdTo' })
  createdTo?: string;

  // Search
  @ApiPropertyOptional({
    description: 'Search term (searches in ticket number, customer name, phone, address)',
    example: 'TK-ABC123',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  // Unassigned filter
  @ApiPropertyOptional({
    description: 'Filter for unassigned tickets only',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unassigned?: boolean;

  // Overdue filter (scheduled but past date)
  @ApiPropertyOptional({
    description: 'Filter for overdue tickets only',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  overdue?: boolean;
}
