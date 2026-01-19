import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Workshops')
@Controller('workshops')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get all workshops' })
  async getAll(
    @Query('city') city?: string,
    @Query('specialization') specialization?: string,
    @Query('isActive') isActive?: string,
    @Query('minRating') minRating?: string,
  ) {
    const filters: any = {};

    if (city) filters.city = city;
    if (specialization) filters.specialization = specialization;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (minRating) filters.minRating = parseFloat(minRating);

    return this.workshopsService.getAll(filters);
  }

  @Get(':id')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get workshop by ID' })
  async getById(@Param('id') id: string) {
    return this.workshopsService.getById(parseInt(id));
  }

  @Get(':id/stats')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get workshop statistics' })
  async getStats(@Param('id') id: string) {
    return this.workshopsService.getStats(parseInt(id));
  }

  @Post()
  // @Roles('admin')
  @ApiOperation({ summary: 'Create new workshop' })
  async create(@Body() data: any) {
    return this.workshopsService.create(data);
  }

  @Patch(':id')
  // @Roles('admin')
  @ApiOperation({ summary: 'Update workshop' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.workshopsService.update(parseInt(id), data);
  }

  @Post('jobs')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Create workshop job' })
  async createJob(@Body() data: any) {
    return this.workshopsService.createJob(data);
  }

  @Patch('jobs/:id')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Update workshop job' })
  async updateJob(@Param('id') id: string, @Body() data: any) {
    return this.workshopsService.updateJob(parseInt(id), data);
  }

  @Get('jobs/ticket/:ticketId')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get workshop jobs by ticket' })
  async getJobsByTicket(@Param('ticketId') ticketId: string) {
    return this.workshopsService.getJobsByTicket(parseInt(ticketId));
  }
}
