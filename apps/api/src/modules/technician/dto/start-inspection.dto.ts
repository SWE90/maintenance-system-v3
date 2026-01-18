import {
  IsArray,
  IsOptional,
  IsString,
  ArrayMinSize,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * DTO for starting device inspection
 * Requires photos of device condition before repair
 */
export class StartInspectionDto {
  @ApiProperty({
    description: 'Photos of device condition before inspection (minimum 1)',
    example: ['https://storage.example.com/photos/device-before-1.jpg'],
    type: [String],
  })
  @IsArray({ message: 'Photos must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 photo is required to start inspection' })
  @IsString({ each: true, message: 'Each photo must be a string URL' })
  photos: string[];

  @ApiPropertyOptional({
    description: 'Initial observations about the device',
    example: 'Device appears to be an older model, visible wear on control panel',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Current location during inspection',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
