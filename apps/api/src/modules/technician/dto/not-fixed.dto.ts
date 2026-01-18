import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Standard reasons for not being able to fix a device
 */
export const NOT_FIXED_REASONS = [
  'customer_unavailable',        // العميل غير متواجد
  'customer_refused_cost',       // العميل رفض التكلفة
  'out_of_service_area',         // خارج نطاق الخدمة
  'device_unrepairable',         // الجهاز غير قابل للإصلاح
  'parts_unavailable',           // قطع الغيار غير متوفرة
  'electrical_issue',            // مشكلة في التيار الكهربائي
  'customer_cancelled',          // العميل ألغى الطلب
  'access_denied',               // تعذر الوصول للموقع
  'safety_concern',              // مخاوف تتعلق بالسلامة
  'other',                       // أخرى
] as const;

/**
 * DTO for marking a task as not fixed
 * Requires at least one reason and evidence
 */
export class NotFixedDto {
  @ApiProperty({
    description: 'Reasons why the device could not be fixed (minimum 1)',
    example: ['customer_refused_cost', 'parts_unavailable'],
    type: [String],
  })
  @IsArray({ message: 'Reasons must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 reason is required' })
  @IsString({ each: true, message: 'Each reason must be a string' })
  reasons: string[];

  @ApiPropertyOptional({
    description: 'Additional explanation for not fixing',
    example: 'Customer declined repair after seeing the estimated cost of 800 SAR',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiPropertyOptional({
    description: 'Photo evidence supporting the reason',
    example: 'https://storage.example.com/photos/evidence.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Evidence photo must be a string URL' })
  evidencePhoto?: string;

  @ApiPropertyOptional({
    description: 'Whether customer acknowledged the not-fixed status',
    example: true,
  })
  @IsOptional()
  customerAcknowledged?: boolean;
}
