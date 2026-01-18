import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * DTO for starting repair work
 */
export class StartRepairDto {
  @ApiPropertyOptional({
    description: 'Notes about starting the repair',
    example: 'Beginning compressor replacement',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiPropertyOptional({
    description: 'Current location',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
