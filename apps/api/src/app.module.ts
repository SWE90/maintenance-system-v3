import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { PrismaModule } from './prisma/prisma.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { SmsModule } from './modules/sms/sms.module';
import { SparePartsModule } from './modules/spare-parts/spare-parts.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { KpiModule } from './modules/kpi/kpi.module';

@Module({
  imports: [
    // Configuration - Global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Scheduled Tasks (Cron Jobs)
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'medium',
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
        {
          name: 'login',
          ttl: config.get('THROTTLE_LOGIN_TTL', 300) * 1000,
          limit: config.get('THROTTLE_LOGIN_LIMIT', 5),
        },
      ],
    }),

    // BullMQ for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
          db: config.get('REDIS_DB', 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),

    // Core modules
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TicketsModule,
    SmsModule,
    SparePartsModule,
    WorkshopsModule,
    KpiModule,
  ],
})
export class AppModule {}
