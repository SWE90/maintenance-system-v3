import {
  IsNumber,
  IsOptional,
  IsInt,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * DTO for updating technician's current location
 * Used for real-time tracking
 */
export class UpdateLocationDto {
  @ApiProperty({
    description: 'Current GPS location',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'Location is required' })
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Speed in km/h',
    example: 45,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Speed must be a number' })
  speed?: number;

  @ApiPropertyOptional({
    description: 'Heading/direction in degrees (0-360)',
    example: 180,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Heading must be a number' })
  heading?: number;

  @ApiPropertyOptional({
    description: 'Associated ticket ID (if currently working on a task)',
    example: 123,
  })
  @IsOptional()
  @IsInt({ message: 'Ticket ID must be an integer' })
  ticketId?: number;
}
