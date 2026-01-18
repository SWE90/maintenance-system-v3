import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { TechnicianService, IUserContext } from './technician.service';
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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@maintenance/shared';

/**
 * Technician Controller
 * Handles all technician workflow endpoints
 */
@ApiTags('Technician')
@Controller('technician')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TECHNICIAN)
@ApiBearerAuth('JWT-auth')
export class TechnicianController {
  private readonly logger = new Logger(TechnicianController.name);

  constructor(private readonly technicianService: TechnicianService) {}

  /**
   * Helper to extract user context from request
   */
  private getUserContext(req: any): IUserContext {
    return {
      id: req.user.id,
      name: req.user.name || req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    };
  }

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * Get technician dashboard statistics
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get technician dashboard',
    description: 'Get statistics and summary for the technician dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    schema: {
      type: 'object',
      properties: {
        assignedToday: { type: 'number', example: 5 },
        completedToday: { type: 'number', example: 3 },
        inProgressToday: { type: 'number', example: 1 },
        totalAssigned: { type: 'number', example: 8 },
        totalInProgress: { type: 'number', example: 2 },
        totalPending: { type: 'number', example: 6 },
        totalCompleted: { type: 'number', example: 150 },
        avgCompletionTimeMinutes: { type: 'number', example: 45 },
        avgRating: { type: 'number', example: 4.7 },
        scheduledToday: { type: 'number', example: 4 },
        overdueTickets: { type: 'number', example: 1 },
      },
    },
  })
  async getDashboard(@Request() req: any) {
    return this.technicianService.getDashboardStats(req.user.id);
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Get assigned tasks with filtering
   */
  @Get('tasks')
  @ApiOperation({
    summary: 'Get my assigned tasks',
    description: 'Get list of tasks assigned to the technician with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of assigned tasks',
  })
  async getTasks(@Request() req: any, @Query() query: TasksQueryDto) {
    return this.technicianService.getTasks(req.user.id, query);
  }

  /**
   * Get task details by ID
   */
  @Get('tasks/:id')
  @ApiOperation({
    summary: 'Get task details',
    description: 'Get detailed information about a specific task',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Task details with all related data',
  })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.technicianService.getTaskById(id, req.user.id);
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  /**
   * Start trip to customer location
   */
  @Post('tasks/:id/start-trip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start trip to customer',
    description: 'Mark the start of the trip to customer location. Requires GPS location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Trip started successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing location' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async startTrip(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StartTripDto,
    @Request() req: any,
  ) {
    return this.technicianService.startTrip(id, dto, this.getUserContext(req));
  }

  /**
   * Mark arrival at customer location
   */
  @Post('tasks/:id/arrive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark arrival at customer',
    description: 'Confirm arrival at customer location. Requires GPS location.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Arrival marked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing location' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async arrive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ArriveDto,
    @Request() req: any,
  ) {
    return this.technicianService.markArrived(id, dto, this.getUserContext(req));
  }

  /**
   * Start device inspection
   */
  @Post('tasks/:id/start-inspection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start device inspection',
    description: 'Begin inspection of the device. Requires at least 1 photo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Inspection started successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing photos' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async startInspection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StartInspectionDto,
    @Request() req: any,
  ) {
    return this.technicianService.startInspection(id, dto, this.getUserContext(req));
  }

  /**
   * Complete device diagnosis
   */
  @Post('tasks/:id/complete-diagnosis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete diagnosis',
    description: 'Complete the diagnosis phase with findings. Requires diagnosis notes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnosis completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing notes' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async completeDiagnosis(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteDiagnosisDto,
    @Request() req: any,
  ) {
    return this.technicianService.completeDiagnosis(id, dto, this.getUserContext(req));
  }

  /**
   * Start repair work
   */
  @Post('tasks/:id/start-repair')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start repair',
    description: 'Begin the repair work on the device',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Repair started successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status for this action' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async startRepair(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StartRepairDto,
    @Request() req: any,
  ) {
    return this.technicianService.startRepair(id, dto, this.getUserContext(req));
  }

  /**
   * Request spare parts
   */
  @Post('tasks/:id/request-parts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request spare parts',
    description: 'Request spare parts for the repair. Requires serial/model photos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Parts request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing photos' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async requestParts(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestPartsDto,
    @Request() req: any,
  ) {
    return this.technicianService.requestParts(id, dto, this.getUserContext(req));
  }

  /**
   * Mark task as not fixed
   */
  @Post('tasks/:id/not-fixed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark as not fixed',
    description: 'Mark the task as unable to be fixed. Requires at least one reason.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Task marked as not fixed',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing reasons' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async notFixed(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NotFixedDto,
    @Request() req: any,
  ) {
    return this.technicianService.markNotFixed(id, dto, this.getUserContext(req));
  }

  /**
   * Pickup device for workshop repair
   */
  @Post('tasks/:id/pickup-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pickup device for workshop',
    description: 'Pickup the device to take to workshop. Requires customer acknowledgment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Device pickup recorded',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or missing acknowledgment' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async pickupDevice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PickupDeviceDto,
    @Request() req: any,
  ) {
    return this.technicianService.pickupDevice(id, dto, this.getUserContext(req));
  }

  /**
   * Send completion OTP to customer
   */
  @Post('tasks/:id/send-completion-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send completion OTP',
    description: 'Send OTP code to customer for repair completion verification',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status for this action' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async sendCompletionOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendCompletionOtpDto,
    @Request() req: any,
  ) {
    return this.technicianService.sendCompletionOtp(id, dto, this.getUserContext(req));
  }

  /**
   * Complete repair with customer confirmation
   */
  @Post('tasks/:id/complete-repair')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete repair',
    description: 'Complete the repair with customer confirmation (signature or OTP). Requires at least 3 photos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Repair completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status, missing photos, or invalid OTP/signature' })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async completeRepair(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteRepairDto,
    @Request() req: any,
  ) {
    return this.technicianService.completeRepair(id, dto, this.getUserContext(req));
  }

  // ============================================
  // LOCATION TRACKING
  // ============================================

  /**
   * Update technician's current location
   */
  @Post('location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current location',
    description: 'Update the technician\'s current GPS location for tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async updateLocation(@Body() dto: UpdateLocationDto, @Request() req: any) {
    return this.technicianService.updateLocation(dto, this.getUserContext(req));
  }

  // ============================================
  // MESSAGING
  // ============================================

  /**
   * Send message to customer
   */
  @Post('tasks/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send message to customer',
    description: 'Send a message to the customer for the task',
  })
  @ApiParam({
    name: 'id',
    description: 'Task/Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiResponse({ status: 403, description: 'Task not assigned to this technician' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @Request() req: any,
  ) {
    return this.technicianService.sendMessage(id, dto, this.getUserContext(req));
  }
}
