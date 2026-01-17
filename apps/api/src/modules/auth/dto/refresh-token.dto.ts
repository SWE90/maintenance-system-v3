import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh Token',
    example: 'uuid-refresh-token',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token مطلوب' })
  refreshToken: string;
}
