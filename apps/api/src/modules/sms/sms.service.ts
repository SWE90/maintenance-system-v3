import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsType, SmsStatus } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectQueue('sms') private smsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send OTP code
   */
  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`Queuing OTP SMS to ${phone}`);

    await this.smsQueue.add('send-otp', {
      phone,
      code,
      type: SmsType.otp,
    });
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`Queuing verification code SMS to ${phone}`);

    await this.smsQueue.add('send-verification', {
      phone,
      code,
      type: SmsType.verification_code,
    });
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignment(
    phone: string,
    ticketNumber: string,
    customerName: string,
  ): Promise<void> {
    this.logger.log(`Queuing task assignment SMS to ${phone}`);

    await this.smsQueue.add('send-notification', {
      phone,
      message: `تم تعيين مهمة جديدة لك - رقم التذكرة: ${ticketNumber} - العميل: ${customerName}`,
      type: SmsType.notification,
    });
  }

  /**
   * Send tracking link
   */
  async sendTrackingLink(phone: string, trackingToken: string): Promise<void> {
    const trackingUrl = `${this.configService.get('APP_URL')}/track/${trackingToken}`;

    this.logger.log(`Queuing tracking link SMS to ${phone}`);

    await this.smsQueue.add('send-tracking-link', {
      phone,
      trackingUrl,
      type: SmsType.tracking_link,
    });
  }

  /**
   * Send visit reminder
   */
  async sendVisitReminder(
    phone: string,
    ticketNumber: string,
    scheduledDate: Date,
  ): Promise<void> {
    const dateStr = new Date(scheduledDate).toLocaleDateString('ar-SA');

    this.logger.log(`Queuing visit reminder SMS to ${phone}`);

    await this.smsQueue.add('send-reminder', {
      phone,
      message: `تذكير: لديك زيارة مجدولة - رقم التذكرة: ${ticketNumber} - التاريخ: ${dateStr}`,
      type: SmsType.visit_reminder,
    });
  }

  /**
   * Send completion OTP
   */
  async sendCompletionOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`Queuing completion OTP SMS to ${phone}`);

    await this.smsQueue.add('send-completion-otp', {
      phone,
      code,
      type: SmsType.completion_otp,
    });
  }

  /**
   * Log SMS in database
   */
  async logSms(
    phone: string,
    message: string,
    type: SmsType,
    status: SmsStatus,
    userId?: number,
    ticketId?: number,
    providerId?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.smsLog.create({
      data: {
        phone,
        message,
        type,
        status,
        userId,
        ticketId,
        providerId,
        errorMessage,
      },
    });
  }
}
