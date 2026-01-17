import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Staff Login (Admin, Supervisor, Technician)
   */
  @Post('staff/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'تسجيل دخول الموظفين' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 401, description: 'بيانات الدخول غير صحيحة' })
  async staffLogin(@Body() dto: StaffLoginDto) {
    return this.authService.staffLogin(dto);
  }

  /**
   * Request OTP for Customer
   */
  @Post('customer/otp/request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'طلب رمز تحقق للعميل' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز التحقق' })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من الطلبات' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  /**
   * Verify OTP and Login Customer
   */
  @Post('customer/otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'تحقق من رمز OTP' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح' })
  @ApiResponse({ status: 401, description: 'رمز التحقق غير صحيح' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * Refresh Access Token
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تجديد Access Token' })
  @ApiResponse({ status: 200, description: 'تم التجديد بنجاح' })
  @ApiResponse({ status: 401, description: 'Refresh token غير صالح' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * Logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'تسجيل الخروج' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * Get Current User Profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
  @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
