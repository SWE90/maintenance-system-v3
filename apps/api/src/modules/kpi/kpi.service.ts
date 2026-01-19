import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate daily KPI snapshot
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailySnapshot() {
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    this.logger.log(`Generating daily KPI snapshot for ${snapshotDate.toISOString()}`);

    const data = await this.calculateKpis(snapshotDate, 'day');

    await this.prisma.kpiSnapshot.upsert({
      where: {
        snapshotDate_snapshotType: {
          snapshotDate,
          snapshotType: 'daily',
        },
      },
      create: {
        snapshotDate,
        snapshotType: 'daily',
        ...data,
      },
      update: data,
    });

    this.logger.log('Daily KPI snapshot generated successfully');
  }

  /**
   * Generate weekly KPI snapshot
   * Runs every Monday at midnight
   */
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklySnapshot() {
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    this.logger.log(`Generating weekly KPI snapshot for ${snapshotDate.toISOString()}`);

    const data = await this.calculateKpis(snapshotDate, 'week');

    await this.prisma.kpiSnapshot.upsert({
      where: {
        snapshotDate_snapshotType: {
          snapshotDate,
          snapshotType: 'weekly',
        },
      },
      create: {
        snapshotDate,
        snapshotType: 'weekly',
        ...data,
      },
      update: data,
    });

    this.logger.log('Weekly KPI snapshot generated successfully');
  }

  /**
   * Generate monthly KPI snapshot
   * Runs on the first day of every month
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlySnapshot() {
    const snapshotDate = new Date();
    snapshotDate.setDate(1);
    snapshotDate.setHours(0, 0, 0, 0);

    this.logger.log(`Generating monthly KPI snapshot for ${snapshotDate.toISOString()}`);

    const data = await this.calculateKpis(snapshotDate, 'month');

    await this.prisma.kpiSnapshot.upsert({
      where: {
        snapshotDate_snapshotType: {
          snapshotDate,
          snapshotType: 'monthly',
        },
      },
      create: {
        snapshotDate,
        snapshotType: 'monthly',
        ...data,
      },
      update: data,
    });

    this.logger.log('Monthly KPI snapshot generated successfully');
  }

  /**
   * Calculate KPIs for a specific period
   */
  private async calculateKpis(date: Date, period: 'day' | 'week' | 'month') {
    const { startDate, endDate } = this.getPeriodDates(date, period);

    // Ticket Metrics
    const [totalTickets, newTickets, assignedTickets, completedTickets, cancelledTickets] =
      await Promise.all([
        this.prisma.ticket.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.ticket.count({
          where: {
            status: 'new',
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.ticket.count({
          where: {
            status: 'assigned',
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.ticket.count({
          where: {
            status: 'completed',
            completedAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.ticket.count({
          where: {
            status: 'cancelled',
            cancelledAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

    // Performance Metrics
    const avgResponseTime = await this.calculateAvgResponseTime(startDate, endDate);
    const avgCompletionTime = await this.calculateAvgCompletionTime(startDate, endDate);
    const firstTimeFixRate = await this.calculateFirstTimeFixRate(startDate, endDate);
    const customerSatisfaction = await this.calculateCustomerSatisfaction(startDate, endDate);

    // Technician Metrics
    const activeTechnicians = await this.prisma.user.count({
      where: {
        role: 'technician',
        status: 'active',
      },
    });

    const avgTicketsPerTech = activeTechnicians > 0 ? totalTickets / activeTechnicians : 0;

    // Financial Metrics (placeholder - implement when billing system is ready)
    const totalRevenue = 0;
    const totalCosts = 0;

    return {
      totalTickets,
      newTickets,
      assignedTickets,
      completedTickets,
      cancelledTickets,
      avgResponseTime,
      avgCompletionTime,
      firstTimeFixRate,
      customerSatisfaction,
      activeTechnicians,
      avgTicketsPerTech,
      totalRevenue,
      totalCosts,
    };
  }

  /**
   * Get period start and end dates
   */
  private getPeriodDates(date: Date, period: 'day' | 'week' | 'month') {
    const startDate = new Date(date);
    const endDate = new Date(date);

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * Calculate average response time (from creation to assignment)
   */
  private async calculateAvgResponseTime(startDate: Date, endDate: Date): Promise<number | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (assigned_at - created_at)) / 60) as avg_minutes
      FROM tickets
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND assigned_at IS NOT NULL
    `;

    return result[0]?.avg_minutes ? Math.round(result[0].avg_minutes) : null;
  }

  /**
   * Calculate average completion time (from creation to completion)
   */
  private async calculateAvgCompletionTime(startDate: Date, endDate: Date): Promise<number | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_minutes
      FROM tickets
      WHERE completed_at >= ${startDate}
        AND completed_at <= ${endDate}
        AND completed_at IS NOT NULL
    `;

    return result[0]?.avg_minutes ? Math.round(result[0].avg_minutes) : null;
  }

  /**
   * Calculate first time fix rate
   */
  private async calculateFirstTimeFixRate(startDate: Date, endDate: Date): Promise<number | null> {
    const [completed, total] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          completedAt: { gte: startDate, lte: endDate },
          status: 'completed',
          completedSuccessfully: true,
        },
      }),
      this.prisma.ticket.count({
        where: {
          completedAt: { gte: startDate, lte: endDate },
          status: { in: ['completed', 'not_fixed'] },
        },
      }),
    ]);

    return total > 0 ? (completed / total) * 100 : null;
  }

  /**
   * Calculate average customer satisfaction
   */
  private async calculateCustomerSatisfaction(
    startDate: Date,
    endDate: Date,
  ): Promise<number | null> {
    const result = await this.prisma.rating.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _avg: {
        score: true,
      },
    });

    return result._avg.score;
  }

  /**
   * Get KPI snapshots with filters
   */
  async getSnapshots(filters?: {
    startDate?: Date;
    endDate?: Date;
    snapshotType?: string;
  }) {
    const where: any = {};

    if (filters?.startDate) {
      where.snapshotDate = { ...where.snapshotDate, gte: filters.startDate };
    }

    if (filters?.endDate) {
      where.snapshotDate = { ...where.snapshotDate, lte: filters.endDate };
    }

    if (filters?.snapshotType) {
      where.snapshotType = filters.snapshotType;
    }

    return this.prisma.kpiSnapshot.findMany({
      where,
      orderBy: {
        snapshotDate: 'desc',
      },
    });
  }
}
