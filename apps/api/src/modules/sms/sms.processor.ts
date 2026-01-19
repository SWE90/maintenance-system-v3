import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsType, SmsStatus } from '@prisma/client';
import axios from 'axios';

@Processor('sms')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing SMS job: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-otp':
          return await this.sendOtpSms(job.data);
        case 'send-verification':
          return await this.sendVerificationSms(job.data);
        case 'send-notification':
          return await this.sendNotificationSms(job.data);
        case 'send-tracking-link':
          return await this.sendTrackingLinkSms(job.data);
        case 'send-reminder':
          return await this.sendReminderSms(job.data);
        case 'send-completion-otp':
          return await this.sendCompletionOtpSms(job.data);
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process SMS job: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendOtpSms(data: any): Promise<void> {
    const { phone, code } = data;
    const message = `رمز التحقق الخاص بك هو: ${code}\n\nصالح لمدة 5 دقائق`;

    await this.sendSms(phone, message, SmsType.otp);
  }

  private async sendVerificationSms(data: any): Promise<void> {
    const { phone, code } = data;
    const message = `رمز التأكيد: ${code}`;

    await this.sendSms(phone, message, SmsType.verification_code);
  }

  private async sendNotificationSms(data: any): Promise<void> {
    const { phone, message } = data;
    await this.sendSms(phone, message, SmsType.notification);
  }

  private async sendTrackingLinkSms(data: any): Promise<void> {
    const { phone, trackingUrl } = data;
    const message = `تتبع طلب الصيانة الخاص بك:\n${trackingUrl}`;

    await this.sendSms(phone, message, SmsType.tracking_link);
  }

  private async sendReminderSms(data: any): Promise<void> {
    const { phone, message } = data;
    await this.sendSms(phone, message, SmsType.visit_reminder);
  }

  private async sendCompletionOtpSms(data: any): Promise<void> {
    const { phone, code } = data;
    const message = `رمز إتمام الخدمة: ${code}\nيرجى إعطاء هذا الرمز للفني`;

    await this.sendSms(phone, message, SmsType.completion_otp);
  }

  /**
   * Core SMS sending function
   * Integrates with SMS provider (Twilio, Taqnyat, etc.)
   */
  private async sendSms(
    phone: string,
    message: string,
    type: SmsType,
  ): Promise<void> {
    const provider = this.configService.get('SMS_PROVIDER', 'mock');

    try {
      if (provider === 'mock') {
        // Mock implementation for development
        this.logger.log(`[MOCK] Sending SMS to ${phone}: ${message}`);

        await this.logSms(phone, message, type, SmsStatus.sent);
        return;
      }

      if (provider === 'twilio') {
        await this.sendViaTwilio(phone, message);
      } else if (provider === 'taqnyat') {
        await this.sendViaTaqnyat(phone, message);
      } else {
        throw new Error(`Unknown SMS provider: ${provider}`);
      }

      await this.logSms(phone, message, type, SmsStatus.sent);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      await this.logSms(
        phone,
        message,
        type,
        SmsStatus.failed,
        undefined,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    await axios.post(
      url,
      new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: message,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
      },
    );

    this.logger.log(`SMS sent via Twilio to ${phone}`);
  }

  /**
   * Send SMS via Taqnyat (Saudi SMS provider)
   */
  private async sendViaTaqnyat(phone: string, message: string): Promise<void> {
    const apiKey = this.configService.get('TAQNYAT_API_KEY');
    const sender = this.configService.get('TAQNYAT_SENDER');

    const url = 'https://api.taqnyat.sa/v1/messages';

    await axios.post(
      url,
      {
        recipients: [phone],
        body: message,
        sender,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    this.logger.log(`SMS sent via Taqnyat to ${phone}`);
  }

  /**
   * Log SMS to database
   */
  private async logSms(
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
