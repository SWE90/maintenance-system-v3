import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FsmService } from './fsm/fsm.service';
import { SmsService } from '../sms/sms.service';
import { OdooService } from '../odoo/odoo.service';
import { AuditService } from '../audit/audit.service';
import { v4 as uuidv4 } from 'uuid';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
  ITaskFilterQuery,
  ErrorCode,
} from '@maintenance/shared';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TransitionTaskDto } from './dto/transition-task.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fsmService: FsmService,
    private readonly smsService: SmsService,
    private readonly odooService: OdooService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate unique ticket number
   */
  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `TKT-${year}-${random}`;
  }

  /**
   * Create new task
   */
  async create(dto: CreateTaskDto, userId: number) {
    // Get customer info
    const customer = await this.prisma.user.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'العميل غير موجود',
      });
    }

    const ticketNumber = this.generateTicketNumber();
    const trackingToken = uuidv4();

    const task = await this.prisma.task.create({
      data: {
        ticketNumber,
        status: 'pending',
        priority: dto.priority || 'normal',
        type: dto.type || 'maintenance',
        customerId: dto.customerId,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email,
        customerAddress: dto.address || customer.address || '',
        customerCity: dto.city || customer.city || '',
        customerDistrict: dto.district || customer.district,
        customerLat: dto.lat || customer.lat,
        customerLng: dto.lng || customer.lng,
        issueDescription: dto.issueDescription,
        productType: dto.productType,
        productModel: dto.productModel,
        productSerial: dto.productSerial,
        scheduledDate: dto.scheduledDate,
        scheduledTime: dto.scheduledTime,
        trackingToken,
        trackingTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    // Create initial stage
    await this.prisma.taskStage.create({
      data: {
        taskId: task.id,
        stageType: 'pending',
        performedBy: userId,
        notes: 'تم إنشاء التذكرة',
      },
    });

    // Create initial time log
    await this.prisma.timeLog.create({
      data: {
        taskId: task.id,
        stageType: 'pending',
        startTime: new Date(),
        performedBy: userId,
      },
    });

    // Audit log
    await this.auditService.logCreate(userId, 'task', task.id, task);

    // Queue Odoo sync
    await this.odooService.queueTaskSync(task.id, 'create');

    this.logger.log(`Created task ${ticketNumber}`);

    return task;
  }

  /**
   * Find all tasks with filters
   */
  async findAll(query: ITaskFilterQuery, userId: number, userRole: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      technicianId,
      customerId,
      priority,
      type,
      city,
      from,
      to,
    } = query;

    const where: any = {};

    // Role-based filtering
    if (userRole === 'technician') {
      where.technicianId = userId;
    } else if (userRole === 'customer') {
      where.customerId = userId;
    }

    // Apply filters
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.customerCity = city;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          technician: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find one task by ID
   */
  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        technician: {
          select: { id: true, name: true, phone: true },
        },
        supervisor: {
          select: { id: true, name: true },
        },
        stages: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        timeLogs: {
          orderBy: { startTime: 'desc' },
        },
        attachments: true,
        smsLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'المهمة غير موجودة',
      });
    }

    return task;
  }

  /**
   * Find task by tracking token (public)
   */
  async findByTrackingToken(token: string) {
    const task = await this.prisma.task.findUnique({
      where: { trackingToken: token },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        customerName: true,
        customerAddress: true,
        customerCity: true,
        customerLat: true,
        customerLng: true,
        scheduledDate: true,
        scheduledTime: true,
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            stageType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'رابط التتبع غير صالح',
      });
    }

    return task;
  }

  /**
   * Update task
   */
  async update(id: number, dto: UpdateTaskDto, userId: number) {
    const task = await this.findOne(id);

    const updated = await this.prisma.task.update({
      where: { id },
      data: dto as any,
    });

    await this.auditService.logUpdate(userId, 'task', id, task, updated);

    return updated;
  }

  /**
   * Transition task status
   */
  async transition(id: number, dto: TransitionTaskDto, userId: number) {
    return this.fsmService.transition(id, dto.toStatus as TaskStatus, userId, {
      notes: dto.notes,
      verificationCode: dto.verificationCode,
      partsUsed: dto.partsUsed,
      location: dto.location,
    });
  }

  /**
   * Assign technician to task
   */
  async assignTechnician(id: number, dto: AssignTechnicianDto, userId: number) {
    const task = await this.findOne(id);

    // Verify technician exists and is active
    const technician = await this.prisma.user.findFirst({
      where: {
        id: dto.technicianId,
        role: 'technician',
        status: 'active',
      },
    });

    if (!technician) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'الفني غير موجود أو غير نشط',
      });
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        technicianId: dto.technicianId,
        supervisorId: userId,
        assignedBy: userId,
        scheduledDate: dto.scheduledDate,
        scheduledTime: dto.scheduledTime,
      },
    });

    await this.auditService.logAssign(userId, id, dto.technicianId);

    // Send SMS to technician
    if (technician.phone) {
      await this.smsService.sendTaskAssignment(
        technician.phone,
        task.ticketNumber,
        task.customerAddress,
      );
    }

    return updated;
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(id: number, userId: number) {
    const task = await this.findOne(id);

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await this.prisma.task.update({
      where: { id },
      data: {
        verificationCode: code,
        verificationCodeSentAt: new Date(),
      },
    });

    // Send SMS to customer
    await this.smsService.sendVerificationCode(
      task.customerPhone,
      id,
      code,
      task.ticketNumber,
    );

    this.logger.log(`Verification code sent for task ${task.ticketNumber}`);

    return { message: 'تم إرسال رمز التحقق' };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: number, userRole: string) {
    const where: any = {};

    if (userRole === 'technician') {
      where.technicianId = userId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pending,
      inProgress,
      completedToday,
      waitingParts,
      total,
    ] = await Promise.all([
      this.prisma.task.count({
        where: { ...where, status: 'pending' },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          status: { in: ['on_route', 'arrived', 'inspecting', 'repairing'] },
        },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          status: 'completed',
          completedAt: { gte: today },
        },
      }),
      this.prisma.task.count({
        where: { ...where, status: 'waiting_parts' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      pending,
      inProgress,
      completedToday,
      waitingParts,
      total,
    };
  }
}
