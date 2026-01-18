import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Location DTO for GPS coordinates
 */
export class LocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 24.7136,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 46.6753,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  longitude: number;

  @ApiPropertyOptional({
    description: 'GPS accuracy in meters',
    example: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Accuracy must be a number' })
  accuracy?: number;
}

/**
 * DTO for starting a trip to customer location
 * Requires GPS location to track technician movement
 */
export class StartTripDto {
  @ApiProperty({
    description: 'Current GPS location of technician',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'Location is required to start trip' })
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Optional notes about the trip start',
    example: 'Starting from workshop',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
