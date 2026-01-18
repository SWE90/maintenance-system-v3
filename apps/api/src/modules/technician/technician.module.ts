import { Module } from '@nestjs/common';

import { TechnicianController } from './technician.controller';
import { TechnicianService } from './technician.service';
import { TechnicianFsmService } from './fsm.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Technician Module
 *
 * Provides all technician workflow functionality including:
 * - Dashboard statistics
 * - Task management with FSM-based transitions
 * - Location tracking
 * - Customer communication
 *
 * All endpoints require TECHNICIAN role authentication.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TechnicianController],
  providers: [TechnicianService, TechnicianFsmService],
  exports: [TechnicianService, TechnicianFsmService],
})
export class TechnicianModule {}
