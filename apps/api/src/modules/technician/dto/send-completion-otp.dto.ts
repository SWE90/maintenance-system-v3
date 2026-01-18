import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for sending completion OTP to customer
 */
export class SendCompletionOtpDto {
  @ApiPropertyOptional({
    description: 'Custom phone number to send OTP (defaults to customer phone)',
    example: '0501234567',
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}
