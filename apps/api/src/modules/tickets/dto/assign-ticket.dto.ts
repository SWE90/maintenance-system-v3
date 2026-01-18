import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for assigning a technician to a ticket
 */
export class AssignTicketDto {
  @ApiProperty({
    description: 'ID of the technician to assign',
    example: 5,
  })
  @IsInt({ message: 'Technician ID must be an integer' })
  @IsNotEmpty({ message: 'Technician ID is required' })
  technicianId: number;

  @ApiPropertyOptional({
    description: 'Internal notes about the assignment',
    example: 'Assigned based on proximity and specialization',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
