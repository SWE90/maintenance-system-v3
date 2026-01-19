import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkshopsService {
  private readonly logger = new Logger(WorkshopsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all workshops with filters
   */
  async getAll(filters?: {
    city?: string;
    specialization?: string;
    isActive?: boolean;
    minRating?: number;
  }) {
    const where: Prisma.WorkshopWhereInput = {};

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.specialization) {
      where.specialization = {
        has: filters.specialization,
      };
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.minRating) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    return this.prisma.workshop.findMany({
      where,
      include: {
        _count: {
          select: {
            workshopJobs: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { completedJobs: 'desc' },
      ],
    });
  }

  /**
   * Get workshop by ID
   */
  async getById(id: number) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: {
        workshopJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workshop) {
      throw new NotFoundException('الورشة غير موجودة');
    }

    return workshop;
  }

  /**
   * Create workshop
   */
  async create(data: Prisma.WorkshopCreateInput) {
    return this.prisma.workshop.create({
      data,
    });
  }

  /**
   * Update workshop
   */
  async update(id: number, data: Prisma.WorkshopUpdateInput) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });

    if (!workshop) {
      throw new NotFoundException('الورشة غير موجودة');
    }

    return this.prisma.workshop.update({
      where: { id },
      data,
    });
  }

  /**
   * Create workshop job
   */
  async createJob(data: {
    ticketId: number;
    workshopId: number;
    description: string;
    estimatedCost?: number;
    estimatedDuration?: number;
    notes?: string;
  }) {
    return this.prisma.workshopJob.create({
      data: {
        ...data,
        status: 'pending',
      },
      include: {
        workshop: true,
      },
    });
  }

  /**
   * Update workshop job
   */
  async updateJob(
    id: number,
    data: {
      status?: string;
      actualCost?: number;
      receivedAt?: Date;
      completedAt?: Date;
      workshopNotes?: string;
    },
  ) {
    const job = await this.prisma.workshopJob.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('مهمة الورشة غير موجودة');
    }

    const updated = await this.prisma.workshopJob.update({
      where: { id },
      data,
      include: {
        workshop: true,
      },
    });

    // Update workshop completed jobs count if completed
    if (data.status === 'completed' && job.status !== 'completed') {
      await this.prisma.workshop.update({
        where: { id: job.workshopId },
        data: {
          completedJobs: { increment: 1 },
        },
      });
    }

    return updated;
  }

  /**
   * Get workshop jobs by ticket
   */
  async getJobsByTicket(ticketId: number) {
    return this.prisma.workshopJob.findMany({
      where: { ticketId },
      include: {
        workshop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get workshop statistics
   */
  async getStats(workshopId: number) {
    const [totalJobs, completedJobs, pendingJobs, avgCost, avgDuration] = await Promise.all([
      this.prisma.workshopJob.count({ where: { workshopId } }),
      this.prisma.workshopJob.count({ where: { workshopId, status: 'completed' } }),
      this.prisma.workshopJob.count({ where: { workshopId, status: 'pending' } }),
      this.prisma.workshopJob.aggregate({
        where: { workshopId, actualCost: { not: null } },
        _avg: { actualCost: true },
      }),
      this.prisma.workshopJob.aggregate({
        where: { workshopId, completedAt: { not: null } },
        _avg: { estimatedDuration: true },
      }),
    ]);

    return {
      totalJobs,
      completedJobs,
      pendingJobs,
      inProgressJobs: totalJobs - completedJobs - pendingJobs,
      avgCost: avgCost._avg.actualCost,
      avgDuration: avgDuration._avg.estimatedDuration,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    };
  }

  /**
   * Update workshop rating
   */
  async updateRating(workshopId: number) {
    const workshop = await this.getById(workshopId);

    // Calculate average rating from completed jobs
    // This is a simplified version - you might want to add actual rating system
    const completionRate = workshop.completedJobs > 0
      ? (workshop.completedJobs / (workshop._count?.workshopJobs || 1)) * 5
      : 0;

    await this.prisma.workshop.update({
      where: { id: workshopId },
      data: {
        rating: Math.min(5, completionRate),
      },
    });
  }
}
