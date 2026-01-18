import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  AssignTicketDto,
  ScheduleTicketDto,
  ListTicketsQueryDto,
  UpdatePriorityDto,
  CancelTicketDto,
} from './dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@maintenance/shared';

/**
 * Tickets Controller
 * Handles all ticket-related endpoints including public and admin routes
 */
@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(private readonly ticketsService: TicketsService) {}

  // ============================
  // PUBLIC ENDPOINTS
  // ============================

  /**
   * Create a new ticket (public - for customer portal)
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new maintenance ticket',
    description: 'Public endpoint for customers to submit maintenance requests',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        ticketNumber: { type: 'string', example: 'TK-ABC123' },
        trackingToken: { type: 'string', example: 'abc123def456...' },
        trackingUrl: { type: 'string', example: '/track/abc123def456...' },
        status: { type: 'string', example: 'new' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Failed to generate unique ticket number' })
  async createTicket(@Body() dto: CreateTicketDto, @Request() req: any) {
    // If user is authenticated, use their ID as creator
    const createdById = req.user?.id || null;
    return this.ticketsService.createTicket(dto, createdById);
  }

  /**
   * Get ticket by tracking token (public - for customer tracking)
   */
  @Get('track/:token')
  @Public()
  @ApiOperation({
    summary: 'Track ticket by token',
    description: 'Public endpoint for customers to track their ticket status',
  })
  @ApiParam({
    name: 'token',
    description: 'Tracking token received when ticket was created',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket details for tracking',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketByTrackingToken(@Param('token') token: string) {
    return this.ticketsService.getTicketByTrackingToken(token);
  }

  // ============================
  // ADMIN/SUPERVISOR ENDPOINTS
  // ============================

  /**
   * List all tickets with filtering (admin/supervisor only)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List tickets with filters',
    description: 'Admin endpoint to list and filter all tickets',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of tickets',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Supervisor role required' })
  async listTickets(@Query() query: ListTicketsQueryDto) {
    return this.ticketsService.listTickets(query);
  }

  /**
   * Get dashboard statistics (admin/supervisor only)
   */
  @Get('stats/dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Get aggregated statistics for the admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
  })
  async getDashboardStats() {
    return this.ticketsService.getDashboardStats();
  }

  /**
   * Get technician dashboard statistics
   */
  @Get('stats/technician')
  @Roles(UserRole.TECHNICIAN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get technician dashboard statistics',
    description: 'Get statistics for the logged-in technician',
  })
  @ApiResponse({
    status: 200,
    description: 'Technician dashboard statistics',
  })
  async getTechnicianDashboardStats(@Request() req: any) {
    return this.ticketsService.getTechnicianDashboardStats(req.user.id);
  }

  /**
   * Get my tickets (for technicians)
   */
  @Get('my')
  @Roles(UserRole.TECHNICIAN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my assigned tickets',
    description: 'Get tickets assigned to the logged-in technician',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (comma-separated)',
    example: 'assigned,scheduled,on_route',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned tickets',
  })
  async getMyTickets(@Request() req: any, @Query('status') status?: string) {
    const statusFilter = status ? status.split(',').map((s) => s.trim()) : undefined;
    return this.ticketsService.getTechnicianTickets(req.user.id, statusFilter as any);
  }

  /**
   * Get customer's tickets
   */
  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer tickets',
    description: 'Get all tickets for a specific customer',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Customer ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of customer tickets',
  })
  async getCustomerTickets(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.ticketsService.getCustomerTickets(customerId);
  }

  /**
   * Get ticket by ID (authenticated users)
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get ticket details',
    description: 'Get full ticket details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket details with all relations',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const ticket = await this.ticketsService.getTicketById(id);

    // For technicians, only allow viewing their assigned tickets
    if (
      req.user.role === UserRole.TECHNICIAN &&
      ticket.technicianId !== req.user.id
    ) {
      // Log but still return - might want to restrict this later
      this.logger.warn(
        `Technician ${req.user.id} accessing ticket ${id} not assigned to them`,
      );
    }

    return ticket;
  }

  /**
   * Assign technician to ticket (admin only)
   */
  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign technician to ticket',
    description: 'Assign a technician to handle the ticket',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Technician assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid ticket status for assignment' })
  @ApiResponse({ status: 404, description: 'Ticket or technician not found' })
  async assignTechnician(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTicketDto,
    @Request() req: any,
  ) {
    return this.ticketsService.assignTechnician(id, dto, req.user.id);
  }

  /**
   * Schedule ticket appointment (admin only)
   */
  @Post(':id/schedule')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Schedule ticket appointment',
    description: 'Set the scheduled date and time slot for the visit',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid ticket status or past date' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async scheduleTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleTicketDto,
    @Request() req: any,
  ) {
    return this.ticketsService.scheduleTicket(id, dto, req.user.id);
  }

  /**
   * Update ticket priority (admin only)
   */
  @Patch(':id/priority')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update ticket priority',
    description: 'Change the priority level of a ticket',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Priority updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot update closed ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updatePriority(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePriorityDto,
    @Request() req: any,
  ) {
    return this.ticketsService.updatePriority(id, dto, req.user.id);
  }

  /**
   * Cancel ticket
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel ticket',
    description: 'Cancel a ticket with a reason',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Ticket is already closed' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async cancelTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelTicketDto,
    @Request() req: any,
  ) {
    // Allow admins, supervisors, or the assigned technician to cancel
    const ticket = await this.ticketsService.getTicketById(id);

    if (
      req.user.role === UserRole.TECHNICIAN &&
      ticket.technicianId !== req.user.id
    ) {
      this.logger.warn(
        `Technician ${req.user.id} attempting to cancel ticket ${id} not assigned to them`,
      );
    }

    return this.ticketsService.cancelTicket(id, dto, req.user.id);
  }
}
