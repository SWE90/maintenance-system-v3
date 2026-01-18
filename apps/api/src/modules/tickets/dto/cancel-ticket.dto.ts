import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for cancelling a ticket
 */
export class CancelTicketDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation - no longer needs service',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString({ message: 'Cancellation reason must be a string' })
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @MinLength(5, { message: 'Cancellation reason must be at least 5 characters' })
  @MaxLength(1000, { message: 'Cancellation reason cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  reason: string;
}
