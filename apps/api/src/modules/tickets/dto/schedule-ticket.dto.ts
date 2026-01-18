import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Time Slot Enum
 */
export enum TimeSlot {
  MORNING = 'morning',
  NOON = 'noon',
  EVENING = 'evening',
}

/**
 * DTO for scheduling a ticket appointment
 */
export class ScheduleTicketDto {
  @ApiProperty({
    description: 'Scheduled date for the visit (ISO 8601 format)',
    example: '2024-12-20',
  })
  @IsDateString({}, { message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate: string;

  @ApiProperty({
    description: 'Time slot for the visit',
    enum: TimeSlot,
    example: TimeSlot.MORNING,
  })
  @IsEnum(TimeSlot, { message: 'Invalid time slot. Must be morning, noon, or evening' })
  @IsNotEmpty({ message: 'Time slot is required' })
  scheduledTimeSlot: TimeSlot;

  @ApiPropertyOptional({
    description: 'Internal notes about the scheduling',
    example: 'Customer prefers morning visits',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
