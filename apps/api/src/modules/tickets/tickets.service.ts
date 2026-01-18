import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TicketStatus, Priority, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  CreateTicketDto,
  AssignTicketDto,
  ScheduleTicketDto,
  ListTicketsQueryDto,
  UpdatePriorityDto,
  CancelTicketDto,
} from './dto';

/**
 * Interface for paginated response
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interface for dashboard statistics
 */
export interface DashboardStats {
  totalTickets: number;
  newTickets: number;
  assignedTickets: number;
  scheduledTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  urgentTickets: number;
  overdueTickets: number;
  avgResolutionTimeHours: number | null;
  ticketsByDeviceType: Record<string, number>;
  ticketsByCity: Record<string, number>;
}

/**
 * Interface for technician dashboard stats
 */
export interface TechnicianDashboardStats {
  assignedToday: number;
  completedToday: number;
  pendingTickets: number;
  inProgressTickets: number;
  scheduledTickets: number;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique ticket number in format TK-XXXXXX
   */
  private generateTicketNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TK-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate secure random tracking token
   */
  private generateTrackingToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new ticket
   * - Generates unique ticketNumber and trackingToken
   * - Creates or finds existing customer by phone
   */
  async createTicket(dto: CreateTicketDto, createdById?: number) {
    this.logger.log(`Creating ticket for phone: ${dto.customerPhone}`);

    // Find or create customer
    let customer = await this.prisma.user.findFirst({
      where: {
        phone: dto.customerPhone,
        role: UserRole.customer,
      },
    });

    if (!customer) {
      this.logger.log(`Creating new customer for phone: ${dto.customerPhone}`);
      customer = await this.prisma.user.create({
        data: {
          phone: dto.customerPhone,
          name: dto.customerName,
          email: dto.customerEmail,
          role: UserRole.customer,
          address: dto.customerAddress,
          city: dto.customerCity,
          lat: dto.latitude,
          lng: dto.longitude,
        },
      });
    }

    // Generate unique ticket number (with retry for uniqueness)
    let ticketNumber: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      ticketNumber = this.generateTicketNumber();
      const existing = await this.prisma.ticket.findUnique({
        where: { ticketNumber },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new ConflictException('Failed to generate unique ticket number. Please try again.');
    }

    // Generate tracking token
    const trackingToken = this.generateTrackingToken();

    // Create the ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber: ticketNumber!,
        trackingToken,
        customerId: customer.id,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        customerCity: dto.customerCity,
        customerAddress: dto.customerAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deviceType: dto.deviceType as any,
        brand: dto.brand,
        model: dto.model,
        problemDescription: dto.problemDescription,
        warrantyStatus: (dto.warrantyStatus as any) || 'unknown',
        invoiceNumber: dto.invoiceNumber,
        serialNumber: dto.serialNumber,
        preferredTimeSlot: dto.preferredTimeSlot as any,
        status: TicketStatus.new,
        priority: Priority.normal,
        createdById,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Create initial status history entry
    await this.prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: null,
        toStatus: TicketStatus.new,
        actorId: createdById,
        actorName: createdById ? 'System' : dto.customerName,
        actorRole: createdById ? UserRole.admin : UserRole.customer,
        notes: 'Ticket created',
      },
    });

    this.logger.log(`Ticket created: ${ticket.ticketNumber}`);

    return {
      ...ticket,
      trackingUrl: `/track/${trackingToken}`,
    };
  }

  /**
   * Get ticket by tracking token (public access)
   */
  async getTicketByTrackingToken(trackingToken: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { trackingToken },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        priority: true,
        customerName: true,
        customerCity: true,
        deviceType: true,
        brand: true,
        model: true,
        problemDescription: true,
        scheduledDate: true,
        scheduledTimeSlot: true,
        createdAt: true,
        updatedAt: true,
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            currentLat: true,
            currentLng: true,
          },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found. Please check your tracking link.');
    }

    return ticket;
  }

  /**
   * List tickets with pagination, filtering, and search
   */
  async listTickets(query: ListTicketsQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      statuses,
      priority,
      deviceType,
      technicianId,
      customerId,
      city,
      scheduledFrom,
      scheduledTo,
      createdFrom,
      createdTo,
      search,
      unassigned,
      overdue,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TicketWhereInput = {};

    // Status filter
    if (status) {
      where.status = status as TicketStatus;
    } else if (statuses) {
      const statusList = statuses.split(',').map((s) => s.trim()) as TicketStatus[];
      where.status = { in: statusList };
    }

    // Priority filter
    if (priority) {
      where.priority = priority as Priority;
    }

    // Device type filter
    if (deviceType) {
      where.deviceType = deviceType as any;
    }

    // Technician filter
    if (technicianId) {
      where.technicianId = technicianId;
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // City filter
    if (city) {
      where.customerCity = { contains: city, mode: 'insensitive' };
    }

    // Scheduled date range
    if (scheduledFrom || scheduledTo) {
      where.scheduledDate = {};
      if (scheduledFrom) {
        where.scheduledDate.gte = new Date(scheduledFrom);
      }
      if (scheduledTo) {
        where.scheduledDate.lte = new Date(scheduledTo);
      }
    }

    // Created date range
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { customerAddress: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Unassigned filter
    if (unassigned) {
      where.technicianId = null;
      where.status = { in: [TicketStatus.new] };
    }

    // Overdue filter
    if (overdue) {
      where.scheduledDate = { lt: new Date() };
      where.status = {
        notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
      };
    }

    // Execute query
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              statusHistory: true,
              attachments: true,
              messages: true,
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get ticket by ID with full relations
   */
  async getTicketById(id: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            phone: true,
            email: true,
            specializations: true,
            isAvailable: true,
            currentLat: true,
            currentLng: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        partsRequests: {
          orderBy: { requestedAt: 'desc' },
        },
        escalations: {
          orderBy: { createdAt: 'desc' },
        },
        timeLogs: {
          orderBy: { startedAt: 'desc' },
        },
        ratings: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  /**
   * Assign technician to a ticket
   */
  async assignTechnician(ticketId: number, dto: AssignTicketDto, assignedById: number) {
    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if ticket can be assigned
    if (ticket.status !== TicketStatus.new && ticket.status !== TicketStatus.assigned) {
      throw new BadRequestException(
        `Cannot assign technician to ticket in status: ${ticket.status}`,
      );
    }

    // Verify technician exists and is available
    const technician = await this.prisma.user.findFirst({
      where: {
        id: dto.technicianId,
        role: UserRole.technician,
        status: 'active',
      },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${dto.technicianId} not found or inactive`);
    }

    // Get assigning user info
    const assignedBy = await this.prisma.user.findUnique({
      where: { id: assignedById },
      select: { name: true, role: true },
    });

    // Update ticket
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        technicianId: dto.technicianId,
        assignedById,
        assignedAt: new Date(),
        status: TicketStatus.assigned,
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Create status history entry
    await this.prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: TicketStatus.assigned,
        actorId: assignedById,
        actorName: assignedBy?.name || 'System',
        actorRole: assignedBy?.role || UserRole.admin,
        notes: dto.notes || `Assigned to ${technician.name}`,
      },
    });

    this.logger.log(
      `Ticket ${ticket.ticketNumber} assigned to technician ${technician.name} (ID: ${dto.technicianId})`,
    );

    return updatedTicket;
  }

  /**
   * Schedule a ticket appointment
   */
  async scheduleTicket(ticketId: number, dto: ScheduleTicketDto, scheduledById: number) {
    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if ticket can be scheduled
    const allowedStatuses = [TicketStatus.new, TicketStatus.assigned, TicketStatus.scheduled];
    if (!allowedStatuses.includes(ticket.status)) {
      throw new BadRequestException(`Cannot schedule ticket in status: ${ticket.status}`);
    }

    // Validate scheduled date is not in the past
    const scheduledDate = new Date(dto.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }

    // Get scheduling user info
    const scheduledBy = await this.prisma.user.findUnique({
      where: { id: scheduledById },
      select: { name: true, role: true },
    });

    // Update ticket
    const previousStatus = ticket.status;
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        scheduledDate,
        scheduledTimeSlot: dto.scheduledTimeSlot as any,
        scheduledSetAt: new Date(),
        status: TicketStatus.scheduled,
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Create status history entry if status changed
    if (previousStatus !== TicketStatus.scheduled) {
      await this.prisma.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: previousStatus,
          toStatus: TicketStatus.scheduled,
          actorId: scheduledById,
          actorName: scheduledBy?.name || 'System',
          actorRole: scheduledBy?.role || UserRole.admin,
          notes:
            dto.notes ||
            `Scheduled for ${dto.scheduledDate} (${dto.scheduledTimeSlot})`,
        },
      });
    }

    this.logger.log(
      `Ticket ${ticket.ticketNumber} scheduled for ${dto.scheduledDate} (${dto.scheduledTimeSlot})`,
    );

    return updatedTicket;
  }

  /**
   * Update ticket priority
   */
  async updatePriority(ticketId: number, dto: UpdatePriorityDto, updatedById: number) {
    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if ticket is not closed
    const closedStatuses = [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed];
    if (closedStatuses.includes(ticket.status)) {
      throw new BadRequestException(`Cannot update priority of closed ticket`);
    }

    // Get updating user info
    const updatedBy = await this.prisma.user.findUnique({
      where: { id: updatedById },
      select: { name: true },
    });

    const previousPriority = ticket.priority;

    // Update ticket
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        priority: dto.priority as Priority,
      },
    });

    // Log the priority change in internal notes
    const noteEntry = `[${new Date().toISOString()}] Priority changed from ${previousPriority} to ${dto.priority} by ${updatedBy?.name || 'Unknown'}${dto.reason ? `: ${dto.reason}` : ''}`;

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        internalNotes: ticket.internalNotes
          ? `${ticket.internalNotes}\n${noteEntry}`
          : noteEntry,
      },
    });

    this.logger.log(
      `Ticket ${ticket.ticketNumber} priority changed from ${previousPriority} to ${dto.priority}`,
    );

    return updatedTicket;
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(ticketId: number, dto: CancelTicketDto, cancelledById: number) {
    // Get ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if ticket is already closed
    const closedStatuses = [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed];
    if (closedStatuses.includes(ticket.status)) {
      throw new BadRequestException(`Ticket is already closed with status: ${ticket.status}`);
    }

    // Get cancelling user info
    const cancelledBy = await this.prisma.user.findUnique({
      where: { id: cancelledById },
      select: { name: true, role: true },
    });

    // Update ticket
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.cancelled,
        cancellationReason: dto.reason,
        cancelledAt: new Date(),
      },
    });

    // Create status history entry
    await this.prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: TicketStatus.cancelled,
        actorId: cancelledById,
        actorName: cancelledBy?.name || 'System',
        actorRole: cancelledBy?.role || UserRole.admin,
        notes: `Cancelled: ${dto.reason}`,
      },
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} cancelled by ${cancelledBy?.name}`);

    return updatedTicket;
  }

  /**
   * Get dashboard statistics for admin/supervisor
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTickets,
      statusCounts,
      urgentTickets,
      overdueTickets,
      completedWithTime,
      deviceTypeCounts,
      cityCounts,
    ] = await Promise.all([
      // Total tickets
      this.prisma.ticket.count(),

      // Status breakdown
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Urgent tickets
      this.prisma.ticket.count({
        where: {
          priority: Priority.urgent,
          status: {
            notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
          },
        },
      }),

      // Overdue tickets
      this.prisma.ticket.count({
        where: {
          scheduledDate: { lt: today },
          status: {
            notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
          },
        },
      }),

      // Completed tickets with resolution time
      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.completed,
          completedAt: { not: null },
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      }),

      // Device type breakdown
      this.prisma.ticket.groupBy({
        by: ['deviceType'],
        _count: { deviceType: true },
      }),

      // City breakdown (top 10)
      this.prisma.ticket.groupBy({
        by: ['customerCity'],
        _count: { customerCity: true },
        orderBy: { _count: { customerCity: 'desc' } },
        take: 10,
      }),
    ]);

    // Process status counts
    const statusMap = new Map(statusCounts.map((s) => [s.status, s._count.status]));

    // Calculate average resolution time
    let avgResolutionTimeHours: number | null = null;
    if (completedWithTime.length > 0) {
      const totalHours = completedWithTime.reduce((sum, ticket) => {
        const diff =
          (ticket.completedAt!.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + diff;
      }, 0);
      avgResolutionTimeHours = Math.round((totalHours / completedWithTime.length) * 10) / 10;
    }

    // In-progress statuses
    const inProgressStatuses = [
      TicketStatus.on_route,
      TicketStatus.arrived,
      TicketStatus.inspecting,
      TicketStatus.diagnosed,
      TicketStatus.repairing,
      TicketStatus.waiting_parts,
      TicketStatus.pickup_device,
      TicketStatus.in_workshop,
      TicketStatus.ready_delivery,
    ];

    const inProgressCount = inProgressStatuses.reduce(
      (sum, status) => sum + (statusMap.get(status) || 0),
      0,
    );

    return {
      totalTickets,
      newTickets: statusMap.get(TicketStatus.new) || 0,
      assignedTickets: statusMap.get(TicketStatus.assigned) || 0,
      scheduledTickets: statusMap.get(TicketStatus.scheduled) || 0,
      inProgressTickets: inProgressCount,
      completedTickets: statusMap.get(TicketStatus.completed) || 0,
      cancelledTickets: statusMap.get(TicketStatus.cancelled) || 0,
      urgentTickets,
      overdueTickets,
      avgResolutionTimeHours,
      ticketsByDeviceType: Object.fromEntries(
        deviceTypeCounts.map((d) => [d.deviceType, d._count.deviceType]),
      ),
      ticketsByCity: Object.fromEntries(
        cityCounts.map((c) => [c.customerCity, c._count.customerCity]),
      ),
    };
  }

  /**
   * Get technician-specific dashboard stats
   */
  async getTechnicianDashboardStats(technicianId: number): Promise<TechnicianDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [assignedToday, completedToday, pendingTickets, inProgressTickets, scheduledTickets] =
      await Promise.all([
        // Assigned today
        this.prisma.ticket.count({
          where: {
            technicianId,
            assignedAt: { gte: today, lt: tomorrow },
          },
        }),

        // Completed today
        this.prisma.ticket.count({
          where: {
            technicianId,
            status: TicketStatus.completed,
            completedAt: { gte: today, lt: tomorrow },
          },
        }),

        // Pending (assigned but not started)
        this.prisma.ticket.count({
          where: {
            technicianId,
            status: { in: [TicketStatus.assigned, TicketStatus.scheduled] },
          },
        }),

        // In progress
        this.prisma.ticket.count({
          where: {
            technicianId,
            status: {
              in: [
                TicketStatus.on_route,
                TicketStatus.arrived,
                TicketStatus.inspecting,
                TicketStatus.diagnosed,
                TicketStatus.repairing,
              ],
            },
          },
        }),

        // Scheduled for today
        this.prisma.ticket.count({
          where: {
            technicianId,
            scheduledDate: { gte: today, lt: tomorrow },
            status: {
              notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
            },
          },
        }),
      ]);

    return {
      assignedToday,
      completedToday,
      pendingTickets,
      inProgressTickets,
      scheduledTickets,
    };
  }

  /**
   * Get tickets for a specific customer
   */
  async getCustomerTickets(customerId: number) {
    return this.prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        trackingToken: true,
        status: true,
        priority: true,
        deviceType: true,
        brand: true,
        model: true,
        problemDescription: true,
        scheduledDate: true,
        scheduledTimeSlot: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get tickets assigned to a specific technician
   */
  async getTechnicianTickets(technicianId: number, statusFilter?: TicketStatus[]) {
    const where: Prisma.TicketWhereInput = {
      technicianId,
    };

    if (statusFilter && statusFilter.length > 0) {
      where.status = { in: statusFilter };
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        _count: {
          select: {
            attachments: true,
            messages: true,
            partsRequests: true,
          },
        },
      },
    });
  }
}
