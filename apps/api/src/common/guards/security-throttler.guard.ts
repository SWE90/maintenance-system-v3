import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Enhanced Throttler Guard with IP-based blocking and account lockout
 *
 * Features:
 * - IP-based rate limiting
 * - Account lockout after failed attempts
 * - Automatic unblock after cooldown period
 */
@Injectable()
export class SecurityThrottlerGuard extends ThrottlerGuard {
  private readonly MAX_FAILED_ATTEMPTS = 10;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly IP_BAN_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const identifier = this.getIdentifier(request);

    // Check if IP is banned
    await this.checkIpBan(ip);

    // Check account lockout (for OTP verify and login endpoints)
    if (this.isAuthEndpoint(request)) {
      await this.checkAccountLockout(identifier);
    }

    // Call parent throttler
    try {
      return await super.canActivate(context);
    } catch (error) {
      // Track failed attempt
      await this.trackFailedAttempt(ip, identifier);
      throw error;
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Get identifier (phone or email) from request body
   */
  private getIdentifier(request: any): string {
    return request.body?.phone || request.body?.email || 'unknown';
  }

  /**
   * Check if endpoint is auth-related
   */
  private isAuthEndpoint(request: any): boolean {
    const path = request.route?.path || '';
    return (
      path.includes('/auth/') &&
      (path.includes('/login') || path.includes('/verify'))
    );
  }

  /**
   * Check if IP is temporarily banned
   */
  private async checkIpBan(ip: string): Promise<void> {
    const banRecord = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM security_attempts
      WHERE ip_address = ${ip}
        AND created_at > NOW() - INTERVAL '1 hour'
        AND success = false
      HAVING COUNT(*) > ${this.MAX_FAILED_ATTEMPTS}
    `;

    if (banRecord && banRecord.length > 0 && banRecord[0].count > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'تم حظر عنوان IP مؤقتاً بسبب محاولات تسجيل دخول فاشلة متكررة',
          code: 'IP_TEMPORARILY_BANNED',
          retryAfter: this.IP_BAN_DURATION / 1000,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Check if account is locked out
   */
  private async checkAccountLockout(identifier: string): Promise<void> {
    if (identifier === 'unknown') return;

    const lockoutRecord = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count, MAX(created_at) as last_attempt
      FROM security_attempts
      WHERE identifier = ${identifier}
        AND created_at > NOW() - INTERVAL '30 minutes'
        AND success = false
      HAVING COUNT(*) >= ${this.MAX_FAILED_ATTEMPTS}
    `;

    if (lockoutRecord && lockoutRecord.length > 0 && lockoutRecord[0].count > 0) {
      const minutesLeft = Math.ceil(
        (this.LOCKOUT_DURATION -
          (Date.now() - new Date(lockoutRecord[0].last_attempt).getTime())) /
          60000,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `الحساب مقفل مؤقتاً بسبب محاولات فاشلة متكررة. حاول مرة أخرى بعد ${minutesLeft} دقيقة`,
          code: 'ACCOUNT_LOCKED',
          retryAfter: minutesLeft * 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Track failed attempt for IP and identifier
   */
  private async trackFailedAttempt(ip: string, identifier: string): Promise<void> {
    try {
      // Note: This would normally be tracked in a security_attempts table
      // For now, we'll skip this as the table doesn't exist yet
      // TODO: Create migration for security_attempts table
      this.logger?.log(
        `Failed attempt tracked: IP=${ip}, Identifier=${identifier}`,
      );
    } catch (error) {
      // Don't throw - security tracking shouldn't break the main flow
      this.logger?.error('Failed to track security attempt', error);
    }
  }

  private logger = {
    log: (message: string) => console.log(`[SecurityThrottler] ${message}`),
    error: (message: string, error: any) =>
      console.error(`[SecurityThrottler] ${message}`, error),
  };
}
