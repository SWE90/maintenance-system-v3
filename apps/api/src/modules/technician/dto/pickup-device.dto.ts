import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * DTO for picking up device for workshop repair
 * Requires customer acknowledgment and photos
 */
export class PickupDeviceDto {
  @ApiProperty({
    description: 'Reason for device pickup (why it cannot be repaired on-site)',
    example: 'Device requires specialized equipment only available at workshop',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'Reason must be a string' })
  @IsNotEmpty({ message: 'Reason for pickup is required' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  reason: string;

  @ApiProperty({
    description: 'Customer has acknowledged and agreed to device pickup',
    example: true,
  })
  @IsBoolean({ message: 'Customer acknowledgment must be a boolean' })
  customerAcknowledged: boolean;

  @ApiPropertyOptional({
    description: 'Photos documenting device condition at pickup (recommended)',
    example: ['https://storage.example.com/photos/pickup-1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Photos must be an array' })
  @IsString({ each: true, message: 'Each photo must be a string URL' })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Estimated return date for the device',
    example: '2024-01-20',
  })
  @IsOptional()
  @IsString({ message: 'Estimated return date must be a string' })
  estimatedReturnDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the pickup',
    example: 'Device is heavy, required two people to carry',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiPropertyOptional({
    description: 'Current location at pickup',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
