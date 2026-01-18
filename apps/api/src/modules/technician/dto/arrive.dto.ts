import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationDto } from './start-trip.dto';

/**
 * DTO for marking arrival at customer location
 * Requires GPS location to confirm arrival at correct address
 */
export class ArriveDto {
  @ApiProperty({
    description: 'Current GPS location confirming arrival',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'Location is required to mark arrival' })
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Notes about arrival (e.g., parking details, access issues)',
    example: 'Customer met me at the building entrance',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
