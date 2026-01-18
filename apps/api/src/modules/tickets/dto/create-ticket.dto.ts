import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Device Type Enum (matching Prisma schema)
 */
export enum DeviceType {
  AC = 'ac',
  WASHER = 'washer',
  FRIDGE = 'fridge',
  OVEN = 'oven',
  DISHWASHER = 'dishwasher',
  OTHER = 'other',
}

/**
 * Time Slot Enum (matching Prisma schema)
 */
export enum TimeSlot {
  MORNING = 'morning',
  NOON = 'noon',
  EVENING = 'evening',
}

/**
 * Warranty Status Enum (matching Prisma schema)
 */
export enum WarrantyStatus {
  YES = 'yes',
  NO = 'no',
  UNKNOWN = 'unknown',
}

/**
 * DTO for creating a new maintenance ticket
 * Used by the public customer portal
 */
export class CreateTicketDto {
  // Customer Information
  @ApiProperty({
    description: 'Customer full name',
    example: 'Ahmed Mohammed',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Customer name must be a string' })
  @IsNotEmpty({ message: 'Customer name is required' })
  @MinLength(2, { message: 'Customer name must be at least 2 characters' })
  @MaxLength(100, { message: 'Customer name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  customerName: string;

  @ApiProperty({
    description: 'Customer phone number (Saudi format)',
    example: '0501234567',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^05\d{8}$/, {
    message: 'Phone number must be a valid Saudi mobile number (05XXXXXXXX)',
  })
  customerPhone: string;

  @ApiPropertyOptional({
    description: 'Customer email address',
    example: 'ahmed@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  customerEmail?: string;

  @ApiProperty({
    description: 'Customer city',
    example: 'Riyadh',
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  customerCity: string;

  @ApiProperty({
    description: 'Customer full address',
    example: 'King Fahd Road, Building 15, Apartment 3',
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @MinLength(10, { message: 'Address must be at least 10 characters' })
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  customerAddress: string;

  @ApiProperty({
    description: 'Location latitude',
    example: 24.7136,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  latitude: number;

  @ApiProperty({
    description: 'Location longitude',
    example: 46.6753,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  longitude: number;

  // Device Information
  @ApiProperty({
    description: 'Type of device requiring maintenance',
    enum: DeviceType,
    example: DeviceType.AC,
  })
  @IsEnum(DeviceType, { message: 'Invalid device type' })
  deviceType: DeviceType;

  @ApiProperty({
    description: 'Device brand/manufacturer',
    example: 'Samsung',
  })
  @IsString({ message: 'Brand must be a string' })
  @IsNotEmpty({ message: 'Brand is required' })
  @MaxLength(100, { message: 'Brand cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  brand: string;

  @ApiPropertyOptional({
    description: 'Device model number',
    example: 'AR24TSHZAWK',
  })
  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  @MaxLength(100, { message: 'Model cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  model?: string;

  @ApiProperty({
    description: 'Description of the problem',
    example: 'The AC unit is not cooling properly and making unusual noise',
  })
  @IsString({ message: 'Problem description must be a string' })
  @IsNotEmpty({ message: 'Problem description is required' })
  @MinLength(10, { message: 'Problem description must be at least 10 characters' })
  @MaxLength(2000, { message: 'Problem description cannot exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  problemDescription: string;

  // Warranty Information
  @ApiPropertyOptional({
    description: 'Warranty status',
    enum: WarrantyStatus,
    default: WarrantyStatus.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(WarrantyStatus, { message: 'Invalid warranty status' })
  warrantyStatus?: WarrantyStatus;

  @ApiPropertyOptional({
    description: 'Invoice number for warranty claims',
    example: 'INV-2024-001234',
  })
  @IsOptional()
  @IsString({ message: 'Invoice number must be a string' })
  @MaxLength(100, { message: 'Invoice number cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Device serial number',
    example: 'SN123456789',
  })
  @IsOptional()
  @IsString({ message: 'Serial number must be a string' })
  @MaxLength(100, { message: 'Serial number cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  serialNumber?: string;

  // Scheduling Preference
  @ApiPropertyOptional({
    description: 'Preferred time slot for the visit',
    enum: TimeSlot,
  })
  @IsOptional()
  @IsEnum(TimeSlot, { message: 'Invalid time slot' })
  preferredTimeSlot?: TimeSlot;
}
