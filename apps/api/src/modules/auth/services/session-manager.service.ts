import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  platform?: string;
  browser?: string;
}

/**
 * Session Management Service
 *
 * Features:
 * - Max 5 active sessions per user
 * - Device fingerprinting
 * - Auto-logout old sessions
 * - Session tracking and monitoring
 */
@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly MAX_SESSIONS_PER_USER = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new session and manage old sessions
   */
  async createSession(
    userId: number,
    refreshToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);

    // Get active sessions count
    const activeSessions = await this.prisma.refreshToken.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // If max sessions reached, revoke oldest session
    if (activeSessions >= this.MAX_SESSIONS_PER_USER) {
      await this.revokeOldestSession(userId);
    }

    // Store device info as metadata
    // Note: This requires adding a metadata field to RefreshToken model
    // For now, we'll just log it
    this.logger.log(
      `Session created for user ${userId} from device: ${deviceFingerprint}`,
    );
  }

  /**
   * Revoke oldest session for user
   */
  private async revokeOldestSession(userId: number): Promise<void> {
    const oldestSession = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (oldestSession) {
      await this.prisma.refreshToken.update({
        where: { id: oldestSession.id },
        data: { revokedAt: new Date() },
      });

      this.logger.log(
        `Revoked oldest session for user ${userId} due to max sessions limit`,
      );
    }
  }

  /**
   * Get all active sessions for user
   */
  async getActiveSessions(userId: number): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        // Add device info fields when metadata is added
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: number, sessionId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
  }

  /**
   * Revoke all sessions except current one
   */
  async revokeAllOtherSessions(
    userId: number,
    currentToken: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: { not: currentToken },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`All other sessions revoked for user ${userId}`);
  }

  /**
   * Cleanup expired sessions (run as cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revokedAt: { not: null },
            revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
          },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  }

  /**
   * Generate device fingerprint from device info
   */
  private generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const data = [
      deviceInfo.userAgent || '',
      deviceInfo.ip || '',
      deviceInfo.platform || '',
      deviceInfo.browser || '',
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Parse user agent to extract device info
   */
  parseUserAgent(userAgent: string): Partial<DeviceInfo> {
    // Simple UA parsing (consider using ua-parser-js library for production)
    const platform = this.extractPlatform(userAgent);
    const browser = this.extractBrowser(userAgent);

    return {
      userAgent,
      platform,
      browser,
    };
  }

  private extractPlatform(ua: string): string {
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    return 'Unknown';
  }

  private extractBrowser(ua: string): string {
    if (/edg/i.test(ua)) return 'Edge';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua)) return 'Safari';
    if (/opera|opr/i.test(ua)) return 'Opera';
    return 'Unknown';
  }
}
