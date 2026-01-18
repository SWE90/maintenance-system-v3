import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for completing device diagnosis
 * Requires detailed diagnosis notes explaining the problem
 */
export class CompleteDiagnosisDto {
  @ApiProperty({
    description: 'Detailed diagnosis notes explaining the problem found',
    example: 'Compressor failure detected. Refrigerant levels low. Capacitor showing signs of wear.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'Diagnosis notes must be a string' })
  @IsNotEmpty({ message: 'Diagnosis notes are required' })
  @MinLength(10, { message: 'Diagnosis notes must be at least 10 characters' })
  @MaxLength(2000, { message: 'Diagnosis notes cannot exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  diagnosisNotes: string;

  @ApiPropertyOptional({
    description: 'Estimated repair cost in SAR',
    example: 500,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated cost must be a number' })
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated repair time in minutes',
    example: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated time must be a number' })
  estimatedTimeMinutes?: number;

  @ApiPropertyOptional({
    description: 'Diagnostic checklist results',
    example: {
      power_supply_ok: true,
      compressor_working: false,
      refrigerant_levels_ok: false,
      thermostat_working: true,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Checklist must be an object' })
  checklist?: Record<string, boolean>;

  @ApiPropertyOptional({
    description: 'List of parts needed for repair',
    example: ['Compressor', 'Capacitor'],
  })
  @IsOptional()
  @IsArray({ message: 'Parts needed must be an array' })
  @IsString({ each: true, message: 'Each part name must be a string' })
  partsNeeded?: string[];

  @ApiPropertyOptional({
    description: 'Whether repair can be done on-site',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'canRepairOnSite must be a boolean' })
  canRepairOnSite?: boolean;
}
