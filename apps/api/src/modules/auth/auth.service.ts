import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { UserRole, IAuthResponse, ITokenPayload, ErrorCode } from '@maintenance/shared';

import { StaffLoginDto } from './dto/staff-login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_LENGTH: number;
  private readonly OTP_EXPIRES_IN: number;
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {
    this.OTP_LENGTH = this.configService.get('OTP_LENGTH', 4);
    this.OTP_EXPIRES_IN = this.configService.get('OTP_EXPIRES_IN', 300); // 5 minutes
  }

  /**
   * Staff Login (Admin, Supervisor, Technician)
   */
  async staffLogin(dto: StaffLoginDto): Promise<IAuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    if (user.role === UserRole.CUSTOMER) {
      throw new UnauthorizedException({
        code: ErrorCode.FORBIDDEN,
        message: 'استخدم بوابة العملاء للدخول',
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException({
        code: ErrorCode.FORBIDDEN,
        message: 'الحساب غير مفعل',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Request OTP for Customer Login
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const phone = this.normalizePhone(dto.phone);

    // Find or create customer
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Create new customer
      user = await this.prisma.user.create({
        data: {
          phone,
          name: 'عميل جديد',
          role: UserRole.CUSTOMER,
          status: 'active',
        },
      });
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException({
        code: ErrorCode.FORBIDDEN,
        message: 'استخدم بوابة الموظفين للدخول',
      });
    }

    // Invalidate previous OTPs
    await this.prisma.otpCode.updateMany({
      where: {
        phone,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
      },
    });

    // Generate new OTP
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRES_IN * 1000);

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        phone,
        code,
        expiresAt,
      },
    });

    // Send SMS
    await this.smsService.sendOtp(phone, code);

    this.logger.log(`OTP sent to ${phone}`);

    return { message: 'تم إرسال رمز التحقق' };
  }

  /**
   * Verify OTP and Login Customer
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<IAuthResponse> {
    const phone = this.normalizePhone(dto.phone);

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code: dto.code,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException({
        code: ErrorCode.OTP_INVALID,
        message: 'رمز التحقق غير صحيح',
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.OTP_EXPIRED,
        message: 'انتهت صلاحية رمز التحقق',
      });
    }

    if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException({
        code: ErrorCode.OTP_MAX_ATTEMPTS,
        message: 'تجاوزت الحد المسموح من المحاولات',
      });
    }

    // Update attempts
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: {
        attempts: { increment: 1 },
        verifiedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.NOT_FOUND,
        message: 'المستخدم غير موجود',
      });
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Refresh Access Token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<IAuthResponse> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token غير صالح',
      });
    }

    if (refreshToken.revokedAt) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token ملغي',
      });
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'انتهت صلاحية Refresh token',
      });
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateAuthResponse(refreshToken.user);
  }

  /**
   * Logout - Revoke Refresh Token
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * Validate User by ID (for JWT Strategy)
   */
  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        nameAr: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Generate Auth Response with Tokens
   */
  private async generateAuthResponse(user: any): Promise<IAuthResponse> {
    const payload: ITokenPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshExpiresMs = this.parseExpiresIn(refreshExpiresIn);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        nameAr: user.nameAr,
        role: user.role as UserRole,
        status: user.status,
      },
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.configService.get('JWT_EXPIRES_IN', '15m')) / 1000,
    };
  }

  /**
   * Generate Random OTP
   */
  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Normalize Phone Number to E.164 format
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

    if (normalized.startsWith('05')) {
      normalized = '966' + normalized.substring(1);
    } else if (normalized.startsWith('5')) {
      normalized = '966' + normalized;
    } else if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  /**
   * Parse expires in string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
}
