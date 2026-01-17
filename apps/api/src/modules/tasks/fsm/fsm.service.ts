import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  TaskStatus,
  StageType,
  ITransitionResult,
  ErrorCode,
  isValidTransition,
  getTransitionRequirements,
  TERMINAL_STATUSES,
} from '@maintenance/shared';
import { TaskStatus as PrismaTaskStatus, StageType as PrismaStageType } from '@prisma/client';

interface TransitionData {
  notes?: string;
  verificationCode?: string;
  partsUsed?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

@Injectable()
export class FsmService {
  private readonly logger = new Logger(FsmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get available transitions from current status
   */
  getAvailableTransitions(currentStatus: TaskStatus): TaskStatus[] {
    if (TERMINAL_STATUSES.includes(currentStatus)) {
      return [];
    }

    const transitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.ACCEPTED, TaskStatus.CANCELLED],
      [TaskStatus.ACCEPTED]: [TaskStatus.SCHEDULED, TaskStatus.CANCELLED],
      [TaskStatus.SCHEDULED]: [TaskStatus.ON_ROUTE, TaskStatus.CANCELLED],
      [TaskStatus.ON_ROUTE]: [TaskStatus.ARRIVED],
      [TaskStatus.ARRIVED]: [TaskStatus.INSPECTING],
      [TaskStatus.INSPECTING]: [TaskStatus.REPAIRING, TaskStatus.NOT_REPAIRED, TaskStatus.WAITING_PARTS],
      [TaskStatus.REPAIRING]: [TaskStatus.COMPLETED, TaskStatus.NOT_REPAIRED, TaskStatus.WAITING_PARTS],
      [TaskStatus.WAITING_PARTS]: [TaskStatus.REPAIRING, TaskStatus.NOT_REPAIRED, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.NOT_REPAIRED]: [],
      [TaskStatus.CANCELLED]: [],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Check if transition is valid
   */
  canTransition(from: TaskStatus, to: TaskStatus): boolean {
    return isValidTransition(from, to);
  }

  /**
   * Execute state transition
   */
  async transition(
    taskId: number,
    toStatus: TaskStatus,
    userId: number,
    data?: TransitionData,
  ): Promise<ITransitionResult> {
    return this.prisma.$transaction(async (tx) => {
      // Get current task
      const task = await tx.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: 'المهمة غير موجودة',
        });
      }

      const fromStatus = task.status as unknown as TaskStatus;

      // Validate transition
      if (!this.canTransition(fromStatus, toStatus)) {
        throw new BadRequestException({
          code: ErrorCode.INVALID_TRANSITION,
          message: `لا يمكن الانتقال من ${fromStatus} إلى ${toStatus}`,
        });
      }

      // Validate requirements
      this.validateTransitionRequirements(task, toStatus, data || {});

      // Get timestamp field name for this status
      const timestampField = this.getTimestampField(toStatus);

      // Update task
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: toStatus as unknown as PrismaTaskStatus,
          ...(timestampField && { [timestampField]: new Date() }),
          ...(data?.notes && this.getNotesField(toStatus) && {
            [this.getNotesField(toStatus)!]: data.notes,
          }),
          ...(data?.partsUsed && { partsUsed: data.partsUsed }),
          ...(data?.verificationCode && toStatus === TaskStatus.COMPLETED && {
            verifiedAt: new Date(),
          }),
        },
      });

      // Create stage record
      const stage = await tx.taskStage.create({
        data: {
          taskId,
          stageType: toStatus as unknown as PrismaStageType,
          performedBy: userId,
          notes: data?.notes,
        },
      });

      // Close previous time log and create new one
      await this.updateTimeLogs(tx, taskId, fromStatus, toStatus, userId);

      // Record location if provided
      if (data?.location) {
        await tx.taskLocation.create({
          data: {
            taskId,
            stageType: toStatus as unknown as PrismaStageType,
            lat: data.location.lat,
            lng: data.location.lng,
          },
        });
      }

      // Audit log
      await this.auditService.logTransition(
        userId,
        taskId,
        fromStatus,
        toStatus,
      );

      this.logger.log(
        `Task ${task.ticketNumber} transitioned: ${fromStatus} -> ${toStatus} by user ${userId}`,
      );

      return {
        success: true,
        task: updatedTask as any,
        previousStatus: fromStatus,
        newStatus: toStatus,
        stage: stage as any,
      };
    });
  }

  /**
   * Validate transition requirements
   */
  private validateTransitionRequirements(
    task: any,
    toStatus: TaskStatus,
    data: TransitionData,
  ): void {
    // Check technician assignment for field work
    const fieldStatuses = [
      TaskStatus.ON_ROUTE,
      TaskStatus.ARRIVED,
      TaskStatus.INSPECTING,
      TaskStatus.REPAIRING,
    ];

    if (fieldStatuses.includes(toStatus) && !task.technicianId) {
      throw new BadRequestException({
        code: ErrorCode.TECHNICIAN_REQUIRED,
        message: 'يجب تعيين فني للمهمة',
      });
    }

    // Check verification code for completion
    if (toStatus === TaskStatus.COMPLETED) {
      if (!data.verificationCode) {
        throw new BadRequestException({
          code: ErrorCode.VERIFICATION_REQUIRED,
          message: 'رمز التحقق مطلوب لإتمام المهمة',
        });
      }

      if (data.verificationCode !== task.verificationCode) {
        throw new BadRequestException({
          code: ErrorCode.VERIFICATION_REQUIRED,
          message: 'رمز التحقق غير صحيح',
        });
      }
    }

    // Check notes for certain transitions
    const notesRequired = [
      TaskStatus.NOT_REPAIRED,
      TaskStatus.CANCELLED,
    ];

    if (notesRequired.includes(toStatus) && !data.notes) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'الملاحظات مطلوبة',
      });
    }
  }

  /**
   * Get timestamp field for status
   */
  private getTimestampField(status: TaskStatus): string | null {
    const fields: Partial<Record<TaskStatus, string>> = {
      [TaskStatus.ACCEPTED]: 'acceptedAt',
      [TaskStatus.SCHEDULED]: 'scheduledAt',
      [TaskStatus.ON_ROUTE]: 'dispatchedAt',
      [TaskStatus.ARRIVED]: 'arrivedAt',
      [TaskStatus.INSPECTING]: 'inspectedAt',
      [TaskStatus.COMPLETED]: 'completedAt',
      [TaskStatus.CANCELLED]: 'cancelledAt',
    };

    return fields[status] || null;
  }

  /**
   * Get notes field for status
   */
  private getNotesField(status: TaskStatus): string | null {
    const fields: Partial<Record<TaskStatus, string>> = {
      [TaskStatus.INSPECTING]: 'inspectionNotes',
      [TaskStatus.REPAIRING]: 'repairNotes',
      [TaskStatus.COMPLETED]: 'completionNotes',
      [TaskStatus.NOT_REPAIRED]: 'completionNotes',
      [TaskStatus.CANCELLED]: 'cancellationReason',
    };

    return fields[status] || null;
  }

  /**
   * Update time logs
   */
  private async updateTimeLogs(
    tx: any,
    taskId: number,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    userId: number,
  ): Promise<void> {
    // Close previous time log
    const previousLog = await tx.timeLog.findFirst({
      where: {
        taskId,
        stageType: fromStatus as unknown as PrismaStageType,
        endTime: null,
      },
    });

    if (previousLog) {
      const endTime = new Date();
      const durationMinutes = Math.round(
        (endTime.getTime() - previousLog.startTime.getTime()) / 60000,
      );

      await tx.timeLog.update({
        where: { id: previousLog.id },
        data: {
          endTime,
          durationMinutes,
        },
      });
    }

    // Create new time log if not terminal
    if (!TERMINAL_STATUSES.includes(toStatus)) {
      await tx.timeLog.create({
        data: {
          taskId,
          stageType: toStatus as unknown as PrismaStageType,
          startTime: new Date(),
          performedBy: userId,
        },
      });
    }
  }
}
