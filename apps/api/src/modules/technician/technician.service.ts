import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TechnicianFsmService, ITransitionContext } from './fsm.service';
import { TicketStatus, UserRole, Prisma, MessageChannel, MessageStatus, PartsRequestStatus, SmsType, SmsStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import {
  StartTripDto,
  ArriveDto,
  StartInspectionDto,
  CompleteDiagnosisDto,
  RequestPartsDto,
  NotFixedDto,
  PickupDeviceDto,
  CompleteRepairDto,
  UpdateLocationDto,
  SendMessageDto,
  StartRepairDto,
  SendCompletionOtpDto,
  TasksQueryDto,
} from './dto';
import { ConfirmationType } from './dto/complete-repair.dto';

/**
 * Dashboard statistics interface
 */
export interface TechnicianDashboardStats {
  // Today's stats
  assignedToday: number;
  completedToday: number;
  inProgressToday: number;

  // Overall stats
  totalAssigned: number;
  totalInProgress: number;
  totalPending: number;
  totalCompleted: number;
  totalNotFixed: number;

  // Performance
  avgCompletionTimeMinutes: number | null;
  avgRating: number | null;
  totalRatings: number;

  // Schedule
  scheduledToday: number;
  overdueTickets: number;
}

/**
 * User context interface
 */
export interface IUserContext {
  id: number;
  name: string;
  role: UserRole;
  phone?: string;
}

/**
 * Technician Service
 * Handles all technician workflow business logic
 */
@Injectable()
export class TechnicianService {
  private readonly logger = new Logger(TechnicianService.name);

  // OTP expiry time in minutes
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fsmService: TechnicianFsmService,
  ) {}

  // ============================================
  // DASHBOARD & STATS
  // ============================================

  /**
   * Get dashboard statistics for a technician
   */
  async getDashboardStats(technicianId: number): Promise<TechnicianDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      assignedToday,
      completedToday,
      inProgressToday,
      totalAssigned,
      totalInProgress,
      totalPending,
      totalCompleted,
      totalNotFixed,
      scheduledToday,
      overdueTickets,
      completedWithTime,
      ratingsData,
    ] = await Promise.all([
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

      // In progress today
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
          updatedAt: { gte: today },
        },
      }),

      // Total assigned (not completed/cancelled)
      this.prisma.ticket.count({
        where: {
          technicianId,
          status: {
            notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
          },
        },
      }),

      // Total in progress
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

      // Total pending (assigned/scheduled)
      this.prisma.ticket.count({
        where: {
          technicianId,
          status: { in: [TicketStatus.assigned, TicketStatus.scheduled] },
        },
      }),

      // Total completed (all time)
      this.prisma.ticket.count({
        where: {
          technicianId,
          status: TicketStatus.completed,
        },
      }),

      // Total not fixed (all time)
      this.prisma.ticket.count({
        where: {
          technicianId,
          status: TicketStatus.not_fixed,
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

      // Overdue tickets
      this.prisma.ticket.count({
        where: {
          technicianId,
          scheduledDate: { lt: today },
          status: {
            notIn: [TicketStatus.completed, TicketStatus.cancelled, TicketStatus.not_fixed],
          },
        },
      }),

      // For average completion time
      this.prisma.ticket.findMany({
        where: {
          technicianId,
          status: TicketStatus.completed,
          completedAt: { not: null },
          tripStartedAt: { not: null },
        },
        select: {
          tripStartedAt: true,
          completedAt: true,
        },
        take: 100,
        orderBy: { completedAt: 'desc' },
      }),

      // Ratings data
      this.prisma.rating.aggregate({
        where: {
          technicianId,
        },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    // Calculate average completion time
    let avgCompletionTimeMinutes: number | null = null;
    if (completedWithTime.length > 0) {
      const totalMinutes = completedWithTime.reduce((sum, ticket) => {
        if (ticket.tripStartedAt && ticket.completedAt) {
          return sum + (ticket.completedAt.getTime() - ticket.tripStartedAt.getTime()) / 60000;
        }
        return sum;
      }, 0);
      avgCompletionTimeMinutes = Math.round(totalMinutes / completedWithTime.length);
    }

    return {
      assignedToday,
      completedToday,
      inProgressToday,
      totalAssigned,
      totalInProgress,
      totalPending,
      totalCompleted,
      totalNotFixed,
      avgCompletionTimeMinutes,
      avgRating: ratingsData._avg.score ? Math.round(ratingsData._avg.score * 10) / 10 : null,
      totalRatings: ratingsData._count.score,
      scheduledToday,
      overdueTickets,
    };
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Get tasks assigned to technician with filtering
   */
  async getTasks(technicianId: number, query: TasksQueryDto) {
    const {
      status,
      scheduledDate,
      scheduledFrom,
      scheduledTo,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      today,
    } = query;

    const skip = (page - 1) * limit;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Build where clause
    const where: Prisma.TicketWhereInput = {
      technicianId,
    };

    // Status filter
    if (status) {
      const statusList = status.split(',').map((s) => s.trim()) as TicketStatus[];
      where.status = { in: statusList };
    }

    // Date filters
    if (today) {
      where.OR = [
        { scheduledDate: { gte: todayStart, lt: tomorrowStart } },
        {
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
      ];
    } else {
      if (scheduledDate) {
        const date = new Date(scheduledDate);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        where.scheduledDate = { gte: date, lt: nextDay };
      } else if (scheduledFrom || scheduledTo) {
        where.scheduledDate = {};
        if (scheduledFrom) {
          where.scheduledDate.gte = new Date(scheduledFrom);
        }
        if (scheduledTo) {
          where.scheduledDate.lte = new Date(scheduledTo);
        }
      }
    }

    // Execute query
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { [sortBy]: sortOrder },
        ],
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
   * Get detailed task by ID (with ownership check)
   */
  async getTaskById(ticketId: number, technicianId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
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
            lat: true,
            lng: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        partsRequests: {
          orderBy: { requestedAt: 'desc' },
        },
        timeLogs: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException({
        code: 'TICKET_NOT_FOUND',
        message: 'Ticket not found',
        messageAr: 'التذكرة غير موجودة',
      });
    }

    // Check ownership
    if (ticket.technicianId !== technicianId) {
      throw new ForbiddenException({
        code: 'NOT_ASSIGNED',
        message: 'This ticket is not assigned to you',
        messageAr: 'هذه التذكرة غير مسندة إليك',
      });
    }

    // Get valid next actions
    const validNextStatuses = this.fsmService.getValidNextStatuses(
      ticket.status,
      UserRole.technician,
    );

    return {
      ...ticket,
      validNextActions: validNextStatuses,
    };
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  /**
   * Start trip to customer location
   */
  async startTrip(ticketId: number, dto: StartTripDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    // Validate current status
    this.validateCurrentStatus(ticket, [TicketStatus.scheduled]);

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.on_route,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.notes,
      location: {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        accuracy: dto.location.accuracy,
      },
    };

    const result = await this.fsmService.executeTransition(context);

    // Update technician's current location
    await this.updateTechnicianLocation(user.id, dto.location, ticketId);

    // Send SMS to customer
    await this.sendSmsNotification(
      ticket.customerPhone,
      `الفني ${user.name} في الطريق إليك. رقم الطلب: ${ticket.ticketNumber}`,
      SmsType.notification,
      ticketId,
      user.id,
    );

    this.logger.log(`Technician ${user.id} started trip for ticket ${ticketId}`);

    return result;
  }

  /**
   * Mark arrival at customer location
   */
  async markArrived(ticketId: number, dto: ArriveDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.on_route]);

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.arrived,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.notes,
      location: {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        accuracy: dto.location.accuracy,
      },
    };

    const result = await this.fsmService.executeTransition(context);

    // Update technician's current location
    await this.updateTechnicianLocation(user.id, dto.location, ticketId);

    // Send SMS to customer
    await this.sendSmsNotification(
      ticket.customerPhone,
      `الفني ${user.name} وصل إلى موقعك. رقم الطلب: ${ticket.ticketNumber}`,
      SmsType.notification,
      ticketId,
      user.id,
    );

    this.logger.log(`Technician ${user.id} arrived at ticket ${ticketId}`);

    return result;
  }

  /**
   * Start device inspection
   */
  async startInspection(ticketId: number, dto: StartInspectionDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.arrived]);

    // Validate minimum photos
    if (!dto.photos || dto.photos.length < 1) {
      throw new BadRequestException({
        code: 'PHOTOS_REQUIRED',
        message: 'At least 1 photo is required to start inspection',
        messageAr: 'مطلوب صورة واحدة على الأقل لبدء الفحص',
      });
    }

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.inspecting,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.notes,
      photos: dto.photos,
      location: dto.location ? {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        accuracy: dto.location.accuracy,
      } : undefined,
    };

    const result = await this.fsmService.executeTransition(context);

    // Save photos as attachments
    await this.saveAttachments(ticketId, dto.photos, 'before_inspection', user);

    this.logger.log(`Technician ${user.id} started inspection for ticket ${ticketId}`);

    return result;
  }

  /**
   * Complete device diagnosis
   */
  async completeDiagnosis(ticketId: number, dto: CompleteDiagnosisDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.inspecting]);

    // Validate diagnosis notes
    if (!dto.diagnosisNotes || dto.diagnosisNotes.length < 10) {
      throw new BadRequestException({
        code: 'NOTES_REQUIRED',
        message: 'Diagnosis notes are required (minimum 10 characters)',
        messageAr: 'ملاحظات التشخيص مطلوبة (10 أحرف على الأقل)',
      });
    }

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.diagnosed,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.diagnosisNotes,
      metadata: {
        checklist: dto.checklist,
        estimatedCost: dto.estimatedCost,
        estimatedTimeMinutes: dto.estimatedTimeMinutes,
        partsNeeded: dto.partsNeeded,
        canRepairOnSite: dto.canRepairOnSite,
      },
    };

    // Update diagnosis notes on ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        diagnosisNotes: dto.diagnosisNotes,
      },
    });

    const result = await this.fsmService.executeTransition(context);

    this.logger.log(`Technician ${user.id} completed diagnosis for ticket ${ticketId}`);

    return result;
  }

  /**
   * Start repair work
   */
  async startRepair(ticketId: number, dto: StartRepairDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.diagnosed, TicketStatus.waiting_parts]);

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.repairing,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.notes,
      location: dto.location ? {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
      } : undefined,
    };

    const result = await this.fsmService.executeTransition(context);

    this.logger.log(`Technician ${user.id} started repair for ticket ${ticketId}`);

    return result;
  }

  /**
   * Request spare parts
   */
  async requestParts(ticketId: number, dto: RequestPartsDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.diagnosed, TicketStatus.repairing]);

    // Validate serial photos
    if (!dto.serialPhotos || dto.serialPhotos.length < 1) {
      throw new BadRequestException({
        code: 'SERIAL_PHOTOS_REQUIRED',
        message: 'At least 1 serial/model photo is required',
        messageAr: 'مطلوب صورة واحدة للرقم التسلسلي على الأقل',
      });
    }

    // Create parts request
    const partsRequest = await this.prisma.partsRequest.create({
      data: {
        ticketId,
        partName: dto.partName,
        partNumber: dto.partNumber,
        quantity: dto.quantity || 1,
        notes: dto.notes,
        photos: [...dto.serialPhotos, ...(dto.additionalPhotos || [])],
        status: PartsRequestStatus.pending,
        requestedById: user.id,
        requestedByName: user.name,
      },
    });

    // Transition to waiting_parts if not already
    if (ticket.status !== TicketStatus.waiting_parts) {
      const context: ITransitionContext = {
        ticketId,
        fromStatus: ticket.status,
        toStatus: TicketStatus.waiting_parts,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        notes: `Parts requested: ${dto.partName}`,
      };

      await this.fsmService.executeTransition(context);
    }

    // Save photos as attachments
    await this.saveAttachments(ticketId, dto.serialPhotos, 'serial_photo', user);
    if (dto.additionalPhotos) {
      await this.saveAttachments(ticketId, dto.additionalPhotos, 'parts_photo', user);
    }

    this.logger.log(`Technician ${user.id} requested parts for ticket ${ticketId}`);

    return partsRequest;
  }

  /**
   * Mark task as not fixed
   */
  async markNotFixed(ticketId: number, dto: NotFixedDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    // Not fixed can be done from multiple states
    this.validateCurrentStatus(ticket, [
      TicketStatus.diagnosed,
      TicketStatus.repairing,
      TicketStatus.waiting_parts,
    ]);

    // Validate reasons
    if (!dto.reasons || dto.reasons.length < 1) {
      throw new BadRequestException({
        code: 'REASONS_REQUIRED',
        message: 'At least 1 reason is required',
        messageAr: 'مطلوب سبب واحد على الأقل',
      });
    }

    const notesText = `Reasons: ${dto.reasons.join(', ')}${dto.notes ? `\nNotes: ${dto.notes}` : ''}`;

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.not_fixed,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: notesText,
      metadata: {
        reasons: dto.reasons,
        customerAcknowledged: dto.customerAcknowledged,
      },
    };

    // Update ticket with not fixed reasons
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        notFixedReasons: dto.reasons,
        completedSuccessfully: false,
      },
    });

    const result = await this.fsmService.executeTransition(context);

    // Save evidence photo if provided
    if (dto.evidencePhoto) {
      await this.saveAttachments(ticketId, [dto.evidencePhoto], 'other', user);
    }

    this.logger.log(`Technician ${user.id} marked ticket ${ticketId} as not fixed`);

    return result;
  }

  /**
   * Pickup device for workshop repair
   */
  async pickupDevice(ticketId: number, dto: PickupDeviceDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.diagnosed]);

    // Validate customer acknowledgment
    if (!dto.customerAcknowledged) {
      throw new BadRequestException({
        code: 'CUSTOMER_ACKNOWLEDGMENT_REQUIRED',
        message: 'Customer acknowledgment is required for device pickup',
        messageAr: 'موافقة العميل مطلوبة لسحب الجهاز',
      });
    }

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.pickup_device,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.reason,
      location: dto.location ? {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
      } : undefined,
      metadata: {
        estimatedReturnDate: dto.estimatedReturnDate,
        customerAcknowledged: true,
      },
    };

    const result = await this.fsmService.executeTransition(context);

    // Save photos if provided
    if (dto.photos && dto.photos.length > 0) {
      await this.saveAttachments(ticketId, dto.photos, 'device_photo', user);
    }

    // Send SMS to customer
    await this.sendSmsNotification(
      ticket.customerPhone,
      `تم سحب جهازك للورشة. سبب: ${dto.reason}. رقم الطلب: ${ticket.ticketNumber}`,
      SmsType.notification,
      ticketId,
      user.id,
    );

    this.logger.log(`Technician ${user.id} picked up device for ticket ${ticketId}`);

    return result;
  }

  /**
   * Complete repair with customer confirmation
   */
  async completeRepair(ticketId: number, dto: CompleteRepairDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    this.validateCurrentStatus(ticket, [TicketStatus.repairing, TicketStatus.ready_delivery]);

    // Validate minimum photos
    if (!dto.photos || dto.photos.length < 3) {
      throw new BadRequestException({
        code: 'PHOTOS_REQUIRED',
        message: 'At least 3 photos are required for completion',
        messageAr: 'مطلوب 3 صور على الأقل لإتمام العملية',
      });
    }

    // Validate confirmation
    let customerConfirmed = false;

    if (dto.confirmationType === ConfirmationType.SIGNATURE) {
      if (!dto.signature) {
        throw new BadRequestException({
          code: 'SIGNATURE_REQUIRED',
          message: 'Customer signature is required',
          messageAr: 'توقيع العميل مطلوب',
        });
      }
      customerConfirmed = true;
    } else if (dto.confirmationType === ConfirmationType.OTP) {
      // Verify OTP
      const isValid = await this.verifyCompletionOtp(ticketId, ticket.customerPhone, dto.otp!);
      if (!isValid) {
        throw new BadRequestException({
          code: 'INVALID_OTP',
          message: 'Invalid or expired OTP code',
          messageAr: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
        });
      }
      customerConfirmed = true;
    }

    const context: ITransitionContext = {
      ticketId,
      fromStatus: ticket.status,
      toStatus: TicketStatus.completed,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      notes: dto.repairNotes,
      photos: dto.photos,
      location: dto.location ? {
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
      } : undefined,
      metadata: {
        customerConfirmed,
        confirmationType: dto.confirmationType,
        partsUsed: dto.partsUsed,
      },
    };

    // Update ticket with completion details
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        repairNotes: dto.repairNotes,
        completedSuccessfully: true,
        customerOtpVerified: dto.confirmationType === ConfirmationType.OTP,
        customerSignature: dto.signature,
        customerRating: dto.customerRating,
        customerFeedback: dto.customerFeedback,
      },
    });

    const result = await this.fsmService.executeTransition(context);

    // Save photos as attachments
    await this.saveAttachments(ticketId, dto.photos, 'after_repair', user);

    // Save signature if provided
    if (dto.signature) {
      await this.saveAttachments(ticketId, [dto.signature], 'signature', user);
    }

    // Create rating if provided
    if (dto.customerRating) {
      await this.prisma.rating.create({
        data: {
          ticketId,
          customerId: ticket.customerId,
          technicianId: user.id,
          score: dto.customerRating,
          feedback: dto.customerFeedback,
        },
      });
    }

    // Send completion SMS
    await this.sendSmsNotification(
      ticket.customerPhone,
      `تم إصلاح جهازك بنجاح! شكراً لاختيارك خدماتنا. رقم الطلب: ${ticket.ticketNumber}`,
      SmsType.notification,
      ticketId,
      user.id,
    );

    this.logger.log(`Technician ${user.id} completed repair for ticket ${ticketId}`);

    return result;
  }

  /**
   * Send completion OTP to customer
   */
  async sendCompletionOtp(ticketId: number, dto: SendCompletionOtpDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    // Must be in repairing or ready_delivery status
    this.validateCurrentStatus(ticket, [TicketStatus.repairing, TicketStatus.ready_delivery]);

    const phone = dto.phone || ticket.customerPhone;
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP
    await this.prisma.otpCode.create({
      data: {
        phone,
        code: otp,
        type: 'completion',
        expiresAt,
        userId: ticket.customerId,
      },
    });

    // Send OTP via SMS
    await this.sendSmsNotification(
      phone,
      `رمز التأكيد لإتمام الصيانة: ${otp}. صالح لمدة ${this.OTP_EXPIRY_MINUTES} دقائق.`,
      SmsType.completion_otp,
      ticketId,
      user.id,
    );

    this.logger.log(`Completion OTP sent for ticket ${ticketId} to ${phone}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      messageAr: 'تم إرسال رمز التأكيد بنجاح',
      expiresAt,
    };
  }

  // ============================================
  // LOCATION TRACKING
  // ============================================

  /**
   * Update technician's current location
   */
  async updateLocation(dto: UpdateLocationDto, user: IUserContext) {
    // Update user's current location
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        currentLat: dto.location.latitude,
        currentLng: dto.location.longitude,
        lastLocationAt: new Date(),
      },
    });

    // Record location history
    await this.prisma.technicianLocation.create({
      data: {
        technicianId: user.id,
        ticketId: dto.ticketId,
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        accuracy: dto.location.accuracy,
        speed: dto.speed,
        heading: dto.heading,
      },
    });

    return {
      success: true,
      timestamp: new Date(),
    };
  }

  // ============================================
  // MESSAGING
  // ============================================

  /**
   * Send message to customer
   */
  async sendMessage(ticketId: number, dto: SendMessageDto, user: IUserContext) {
    const ticket = await this.validateTicketOwnership(ticketId, user.id);

    // Create message record
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        content: dto.content,
        channel: (dto.channel || 'internal') as MessageChannel,
        status: MessageStatus.sent,
      },
    });

    // Send via SMS if requested
    if (dto.channel === 'sms') {
      await this.sendSmsNotification(
        ticket.customerPhone,
        `من الفني ${user.name}: ${dto.content}`,
        SmsType.notification,
        ticketId,
        user.id,
      );
    }

    this.logger.log(`Technician ${user.id} sent message for ticket ${ticketId}`);

    return message;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Validate ticket ownership by technician
   */
  private async validateTicketOwnership(ticketId: number, technicianId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException({
        code: 'TICKET_NOT_FOUND',
        message: 'Ticket not found',
        messageAr: 'التذكرة غير موجودة',
      });
    }

    if (ticket.technicianId !== technicianId) {
      throw new ForbiddenException({
        code: 'NOT_ASSIGNED',
        message: 'This ticket is not assigned to you',
        messageAr: 'هذه التذكرة غير مسندة إليك',
      });
    }

    return ticket;
  }

  /**
   * Validate current ticket status is one of expected statuses
   */
  private validateCurrentStatus(ticket: { status: TicketStatus }, expectedStatuses: TicketStatus[]) {
    if (!expectedStatuses.includes(ticket.status)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Cannot perform this action when ticket is in ${ticket.status} status`,
        messageAr: `لا يمكن تنفيذ هذا الإجراء والتذكرة في حالة ${ticket.status}`,
        currentStatus: ticket.status,
        expectedStatuses,
      });
    }
  }

  /**
   * Update technician's current location
   */
  private async updateTechnicianLocation(
    technicianId: number,
    location: { latitude: number; longitude: number; accuracy?: number },
    ticketId?: number,
  ) {
    await this.prisma.user.update({
      where: { id: technicianId },
      data: {
        currentLat: location.latitude,
        currentLng: location.longitude,
        lastLocationAt: new Date(),
      },
    });

    await this.prisma.technicianLocation.create({
      data: {
        technicianId,
        ticketId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
    });
  }

  /**
   * Save attachments for a ticket
   */
  private async saveAttachments(
    ticketId: number,
    urls: string[],
    type: string,
    user: IUserContext,
  ) {
    const attachments = urls.map((url) => ({
      ticketId,
      type: type as any,
      url,
      filename: url.split('/').pop() || 'attachment',
      originalName: url.split('/').pop() || 'attachment',
      mimeType: this.guessMimeType(url),
      size: 0, // Would need to fetch actual size
      uploadedById: user.id,
      uploadedByName: user.name,
    }));

    await this.prisma.ticketAttachment.createMany({
      data: attachments,
    });
  }

  /**
   * Guess MIME type from URL
   */
  private guessMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Verify completion OTP
   */
  private async verifyCompletionOtp(ticketId: number, phone: string, code: string): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        type: 'completion',
        expiresAt: { gt: new Date() },
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return false;
    }

    // Mark as verified
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });

    return true;
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    phone: string,
    message: string,
    type: SmsType,
    ticketId?: number,
    userId?: number,
  ) {
    // Log SMS (actual sending would be done by SMS service)
    await this.prisma.smsLog.create({
      data: {
        phone,
        message,
        type,
        ticketId,
        userId,
        status: SmsStatus.pending,
        // In production, this would trigger actual SMS sending
      },
    });

    this.logger.log(`SMS queued for ${phone}: ${message.substring(0, 50)}...`);
  }
}
