import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * Confirmation type for completing repair
 */
export enum ConfirmationType {
  SIGNATURE = 'signature',
  OTP = 'otp',
}

/**
 * DTO for completing a repair
 * Requires photos, notes, and customer confirmation
 */
export class CompleteRepairDto {
  @ApiProperty({
    description: 'Photos documenting completed repair (minimum 3: before, during, after)',
    example: [
      'https://storage.example.com/photos/before.jpg',
      'https://storage.example.com/photos/during.jpg',
      'https://storage.example.com/photos/after.jpg',
    ],
    type: [String],
  })
  @IsArray({ message: 'Photos must be an array' })
  @ArrayMinSize(3, { message: 'At least 3 photos are required for completion' })
  @IsString({ each: true, message: 'Each photo must be a string URL' })
  photos: string[];

  @ApiPropertyOptional({
    description: 'Notes about the repair performed',
    example: 'Replaced compressor and recharged refrigerant. Device tested and working normally.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  repairNotes?: string;

  @ApiProperty({
    description: 'Method of customer confirmation',
    enum: ConfirmationType,
    example: ConfirmationType.OTP,
  })
  @IsEnum(ConfirmationType, { message: 'Invalid confirmation type' })
  confirmationType: ConfirmationType;

  @ApiPropertyOptional({
    description: 'Customer signature (Base64 encoded) - required if confirmationType is signature',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @ValidateIf((o) => o.confirmationType === ConfirmationType.SIGNATURE)
  @IsNotEmpty({ message: 'Signature is required when using signature confirmation' })
  @IsString({ message: 'Signature must be a string' })
  signature?: string;

  @ApiPropertyOptional({
    description: 'OTP code from customer - required if confirmationType is otp',
    example: '123456',
  })
  @ValidateIf((o) => o.confirmationType === ConfirmationType.OTP)
  @IsNotEmpty({ message: 'OTP is required when using OTP confirmation' })
  @IsString({ message: 'OTP must be a string' })
  otp?: string;

  @ApiPropertyOptional({
    description: 'Customer rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  customerRating?: number;

  @ApiPropertyOptional({
    description: 'Customer feedback about the service',
    example: 'Excellent service, very professional technician',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Feedback must be a string' })
  @MaxLength(1000, { message: 'Feedback cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  customerFeedback?: string;

  @ApiPropertyOptional({
    description: 'List of parts used in repair',
    example: ['Compressor', 'Refrigerant 1kg'],
  })
  @IsOptional()
  @IsArray({ message: 'Parts used must be an array' })
  @IsString({ each: true, message: 'Each part must be a string' })
  partsUsed?: string[];

  @ApiPropertyOptional({
    description: 'Current location at completion',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
