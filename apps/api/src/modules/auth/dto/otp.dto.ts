import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'رقم الجوال',
    example: '0551234567',
  })
  @IsString({ message: 'رقم الجوال مطلوب' })
  @Matches(/^(05|5|966|\+966)[0-9]{8,9}$/, {
    message: 'رقم الجوال غير صالح',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'رقم الجوال',
    example: '0551234567',
  })
  @IsString({ message: 'رقم الجوال مطلوب' })
  @Matches(/^(05|5|966|\+966)[0-9]{8,9}$/, {
    message: 'رقم الجوال غير صالح',
  })
  phone: string;

  @ApiProperty({
    description: 'رمز التحقق',
    example: '1234',
  })
  @IsString({ message: 'رمز التحقق مطلوب' })
  @Length(4, 6, { message: 'رمز التحقق يجب أن يكون 4-6 أرقام' })
  code: string;
}
