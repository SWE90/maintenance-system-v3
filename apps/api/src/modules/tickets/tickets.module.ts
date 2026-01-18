import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/**
 * Tickets Module
 *
 * Handles all ticket-related functionality including:
 * - Ticket creation (public endpoint for customer portal)
 * - Ticket tracking (public endpoint)
 * - Ticket management (admin endpoints)
 * - Technician assignment and scheduling
 * - Dashboard statistics
 *
 * Note: PrismaService is globally provided by PrismaModule,
 * so no need to import it here.
 */
@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
