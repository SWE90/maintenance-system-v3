import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, UserRole, Prisma } from '@prisma/client';
import {
  FSM_TRANSITIONS,
  isValidTransition,
  getTransitionRequirements,
  TERMINAL_STATUSES as TERMINAL_STATUS_ENUMS,
} from '@maintenance/shared';
import { TicketStatus as SharedTicketStatus } from '@maintenance/shared';

/**
 * Interface for FSM transition context
 */
export interface ITransitionContext {
  ticketId: number;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  actorId: number;
  actorName: string;
  actorRole: UserRole;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  photos?: string[];
  metadata?: Record<string, any>;
}

/**
 * Interface for FSM transition result
 */
export interface ITransitionResult {
  success: boolean;
  ticket: any;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  historyEntry: any;
  timeLog?: any;
}

/**
 * Interface for validation errors
 */
export interface IValidationError {
  field: string;
  message: string;
  messageAr: string;
}

/**
 * Technician FSM Service
 * Handles state machine transitions with validation and audit trail
 */
@Injectable()
export class TechnicianFsmService {
  private readonly logger = new Logger(TechnicianFsmService.name);

  // Map shared enum to Prisma enum
  private readonly TERMINAL_STATUSES: TicketStatus[] = [
    TicketStatus.completed,
    TicketStatus.not_fixed,
    TicketStatus.cancelled,
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate if a transition is allowed
   */
  validateTransition(
    fromStatus: TicketStatus,
    toStatus: TicketStatus,
    role: UserRole,
  ): { valid: boolean; errors: IValidationError[] } {
    const errors: IValidationError[] = [];

    // Convert to shared enum for FSM validation
    const from = fromStatus as unknown as SharedTicketStatus;
    const to = toStatus as unknown as SharedTicketStatus;

    // Check if transition exists
    if (!isValidTransition(from, to)) {
      errors.push({
        field: 'status',
        message: `Cannot transition from ${fromStatus} to ${toStatus}`,
        messageAr: `لا يمكن الانتقال من ${fromStatus} إلى ${toStatus}`,
      });
      return { valid: false, errors };
    }

    // Check role permission
    const requirements = getTransitionRequirements(from, to);
    if (requirements && requirements.allowedRoles.length > 0) {
      if (!requirements.allowedRoles.includes(role)) {
        errors.push({
          field: 'role',
          message: `Role ${role} is not allowed to perform this transition`,
          messageAr: `الدور ${role} غير مسموح له بتنفيذ هذا الانتقال`,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get valid next statuses from current status
   */
  getValidNextStatuses(currentStatus: TicketStatus, role: UserRole): TicketStatus[] {
    const transition = FSM_TRANSITIONS[currentStatus as unknown as SharedTicketStatus];
    if (!transition) {
      return [];
    }

    // Filter by role if specified
    return transition.to
      .filter((toStatus) => {
        const req = getTransitionRequirements(
          currentStatus as unknown as SharedTicketStatus,
          toStatus,
        );
        if (!req || !req.allowedRoles || req.allowedRoles.length === 0) {
          return true;
        }
        return req.allowedRoles.includes(role);
      })
      .map((s) => s as unknown as TicketStatus);
  }

  /**
   * Check if status is terminal (no further transitions possible)
   */
  isTerminalStatus(status: TicketStatus): boolean {
    return this.TERMINAL_STATUSES.includes(status);
  }

  /**
   * Execute a state transition with full audit trail
   */
  async executeTransition(context: ITransitionContext): Promise<ITransitionResult> {
    const { ticketId, fromStatus, toStatus, actorId, actorName, actorRole, notes, location, photos, metadata } = context;

    this.logger.log(
      `Executing transition for ticket ${ticketId}: ${fromStatus} -> ${toStatus} by ${actorName} (${actorRole})`,
    );

    // Validate transition
    const validation = this.validateTransition(fromStatus, toStatus, actorRole);
    if (!validation.valid) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: validation.errors[0]?.message || 'Invalid transition',
        messageAr: validation.errors[0]?.messageAr || 'انتقال غير صالح',
        errors: validation.errors,
      });
    }

    // Validate requirements
    this.validateTransitionRequirements(fromStatus, toStatus, { photos, notes, metadata });

    return this.prisma.$transaction(async (tx) => {
      // Get timestamp field and notes field for this transition
      const timestampField = this.getTimestampField(toStatus);
      const notesField = this.getNotesField(toStatus);

      // Build update data
      const updateData: Prisma.TicketUpdateInput = {
        status: toStatus,
        ...(timestampField && { [timestampField]: new Date() }),
        ...(notesField && notes && { [notesField]: notes }),
      };

      // Update ticket
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          technician: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      // Create status history entry
      const historyEntry = await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus,
          toStatus,
          actorId,
          actorName,
          actorRole,
          notes,
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
      });

      // Store location at this transition if provided
      if (location) {
        await tx.ticketLocation.create({
          data: {
            ticketId,
            status: toStatus,
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });
      }

      // Update time logs
      const timeLog = await this.updateTimeLogs(tx, ticketId, fromStatus, toStatus, actorId);

      this.logger.log(
        `Transition completed for ticket ${ticketId}: ${fromStatus} -> ${toStatus}`,
      );

      return {
        success: true,
        ticket: updatedTicket,
        previousStatus: fromStatus,
        newStatus: toStatus,
        historyEntry,
        timeLog,
      };
    });
  }

  /**
   * Validate specific requirements for a transition
   */
  private validateTransitionRequirements(
    fromStatus: TicketStatus,
    toStatus: TicketStatus,
    data: { photos?: string[]; notes?: string; metadata?: Record<string, any> },
  ): void {
    const from = fromStatus as unknown as SharedTicketStatus;
    const to = toStatus as unknown as SharedTicketStatus;
    const requirements = getTransitionRequirements(from, to);

    if (!requirements) {
      return;
    }

    // Check photo requirements
    if (requirements.requiresPhotos) {
      const minPhotos = requirements.minPhotos || 1;
      if (!data.photos || data.photos.length < minPhotos) {
        throw new BadRequestException({
          code: 'PHOTOS_REQUIRED',
          message: `At least ${minPhotos} photo(s) required for this transition`,
          messageAr: `مطلوب ${minPhotos} صورة على الأقل لهذا الانتقال`,
        });
      }
    }

    // Check notes requirements
    if (requirements.requiresNotes && !data.notes) {
      throw new BadRequestException({
        code: 'NOTES_REQUIRED',
        message: 'Notes are required for this transition',
        messageAr: 'الملاحظات مطلوبة لهذا الانتقال',
      });
    }

    // Check customer confirmation requirements
    if (requirements.requiresCustomerConfirmation) {
      if (!data.metadata?.customerConfirmed) {
        throw new BadRequestException({
          code: 'CUSTOMER_CONFIRMATION_REQUIRED',
          message: 'Customer confirmation is required for this transition',
          messageAr: 'تأكيد العميل مطلوب لهذا الانتقال',
        });
      }
    }
  }

  /**
   * Get the timestamp field name for a given status
   */
  private getTimestampField(status: TicketStatus): string | null {
    const fields: Partial<Record<TicketStatus, string>> = {
      [TicketStatus.scheduled]: 'scheduledSetAt',
      [TicketStatus.on_route]: 'tripStartedAt',
      [TicketStatus.arrived]: 'arrivedAt',
      [TicketStatus.inspecting]: 'inspectionStartedAt',
      [TicketStatus.diagnosed]: 'diagnosedAt',
      [TicketStatus.repairing]: 'repairStartedAt',
      [TicketStatus.completed]: 'completedAt',
      [TicketStatus.cancelled]: 'cancelledAt',
    };
    return fields[status] || null;
  }

  /**
   * Get the notes field name for a given status
   */
  private getNotesField(status: TicketStatus): string | null {
    const fields: Partial<Record<TicketStatus, string>> = {
      [TicketStatus.diagnosed]: 'diagnosisNotes',
      [TicketStatus.repairing]: 'repairNotes',
      [TicketStatus.completed]: 'repairNotes',
      [TicketStatus.not_fixed]: 'internalNotes',
      [TicketStatus.cancelled]: 'cancellationReason',
    };
    return fields[status] || null;
  }

  /**
   * Update time logs for tracking stage durations
   */
  private async updateTimeLogs(
    tx: Prisma.TransactionClient,
    ticketId: number,
    fromStatus: TicketStatus,
    toStatus: TicketStatus,
    technicianId: number,
  ): Promise<any> {
    // Close previous open time log
    const previousLog = await tx.timeLog.findFirst({
      where: {
        ticketId,
        stage: fromStatus,
        endedAt: null,
      },
    });

    if (previousLog) {
      const endTime = new Date();
      const durationMinutes = Math.round(
        (endTime.getTime() - previousLog.startedAt.getTime()) / 60000,
      );

      await tx.timeLog.update({
        where: { id: previousLog.id },
        data: {
          endedAt: endTime,
          durationMinutes,
        },
      });
    }

    // Create new time log if not entering a terminal state
    if (!this.isTerminalStatus(toStatus)) {
      return tx.timeLog.create({
        data: {
          ticketId,
          technicianId,
          stage: toStatus,
          startedAt: new Date(),
        },
      });
    }

    return null;
  }

  /**
   * Get transition requirements as a response object
   */
  getRequirementsForTransition(
    fromStatus: TicketStatus,
    toStatus: TicketStatus,
  ): {
    requiresPhotos: boolean;
    requiresNotes: boolean;
    requiresCustomerConfirmation: boolean;
    minPhotos: number;
    allowedRoles: string[];
  } | null {
    const from = fromStatus as unknown as SharedTicketStatus;
    const to = toStatus as unknown as SharedTicketStatus;
    return getTransitionRequirements(from, to);
  }
}
