import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayMinSize,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for requesting spare parts
 * Requires part details and photos of the serial/model plate
 */
export class RequestPartsDto {
  @ApiProperty({
    description: 'Name of the part needed',
    example: 'Compressor',
  })
  @IsString({ message: 'Part name must be a string' })
  @IsNotEmpty({ message: 'Part name is required' })
  @MaxLength(200, { message: 'Part name cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  partName: string;

  @ApiPropertyOptional({
    description: 'Part number/code if known',
    example: 'COMP-SAM-AC-001',
  })
  @IsOptional()
  @IsString({ message: 'Part number must be a string' })
  @MaxLength(100, { message: 'Part number cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  partNumber?: string;

  @ApiPropertyOptional({
    description: 'Quantity needed',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;

  @ApiProperty({
    description: 'Photos of device serial plate / model number (minimum 1)',
    example: ['https://storage.example.com/photos/serial-plate.jpg'],
    type: [String],
  })
  @IsArray({ message: 'Serial photos must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 serial/model photo is required' })
  @IsString({ each: true, message: 'Each photo must be a string URL' })
  serialPhotos: string[];

  @ApiPropertyOptional({
    description: 'Additional photos of the faulty part',
    example: ['https://storage.example.com/photos/faulty-compressor.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Additional photos must be an array' })
  @IsString({ each: true, message: 'Each photo must be a string URL' })
  additionalPhotos?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes about the part request',
    example: 'Original part is Samsung brand, may need compatible replacement',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiPropertyOptional({
    description: 'Urgency level of the request',
    example: 'high',
  })
  @IsOptional()
  @IsString({ message: 'Urgency must be a string' })
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
}
