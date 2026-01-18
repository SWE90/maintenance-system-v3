import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Message channel options
 */
export enum MessageChannel {
  INTERNAL = 'internal',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

/**
 * DTO for sending a message to customer
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Message content to send to customer',
    example: 'I am 10 minutes away from your location.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message content is required' })
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiPropertyOptional({
    description: 'Channel to send message through',
    enum: MessageChannel,
    default: MessageChannel.INTERNAL,
  })
  @IsOptional()
  @IsEnum(MessageChannel, { message: 'Invalid message channel' })
  channel?: MessageChannel;
}
