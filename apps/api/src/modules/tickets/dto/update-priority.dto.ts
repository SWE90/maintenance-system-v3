import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Priority Enum
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * DTO for updating ticket priority
 */
export class UpdatePriorityDto {
  @ApiProperty({
    description: 'New priority level',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority, { message: 'Invalid priority. Must be low, normal, high, or urgent' })
  @IsNotEmpty({ message: 'Priority is required' })
  priority: Priority;

  @ApiPropertyOptional({
    description: 'Reason for priority change',
    example: 'Customer escalation due to business impact',
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  reason?: string;
}
