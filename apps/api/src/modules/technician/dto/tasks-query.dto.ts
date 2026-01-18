import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * Ticket status enum for filtering
 */
export enum TicketStatusFilter {
  ASSIGNED = 'assigned',
  SCHEDULED = 'scheduled',
  ON_ROUTE = 'on_route',
  ARRIVED = 'arrived',
  INSPECTING = 'inspecting',
  DIAGNOSED = 'diagnosed',
  REPAIRING = 'repairing',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  NOT_FIXED = 'not_fixed',
}

/**
 * Sort options for task list
 */
export enum TaskSortBy {
  SCHEDULED_DATE = 'scheduledDate',
  PRIORITY = 'priority',
  CREATED_AT = 'createdAt',
  DISTANCE = 'distance',
}

/**
 * DTO for querying technician's tasks with filters
 */
export class TasksQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status (comma-separated for multiple)',
    example: 'assigned,scheduled,on_route',
  })
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Filter from scheduled date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  scheduledFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter to scheduled date',
    example: '2024-01-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  scheduledTo?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: TaskSortBy,
    default: TaskSortBy.SCHEDULED_DATE,
  })
  @IsOptional()
  @IsEnum(TaskSortBy, { message: 'Invalid sort field' })
  sortBy?: TaskSortBy;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Include only today\'s tasks',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  today?: boolean;
}
