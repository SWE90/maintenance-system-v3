import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('KPI')
@Controller('kpi')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('snapshots')
  // @Roles('admin')
  @ApiOperation({ summary: 'Get KPI snapshots' })
  async getSnapshots(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('snapshotType') snapshotType?: string,
  ) {
    const filters: any = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (snapshotType) filters.snapshotType = snapshotType;

    return this.kpiService.getSnapshots(filters);
  }

  @Post('generate/daily')
  // @Roles('admin')
  @ApiOperation({ summary: 'Generate daily KPI snapshot manually' })
  async generateDaily() {
    await this.kpiService.generateDailySnapshot();
    return { message: 'Daily snapshot generated successfully' };
  }

  @Post('generate/weekly')
  // @Roles('admin')
  @ApiOperation({ summary: 'Generate weekly KPI snapshot manually' })
  async generateWeekly() {
    await this.kpiService.generateWeeklySnapshot();
    return { message: 'Weekly snapshot generated successfully' };
  }

  @Post('generate/monthly')
  // @Roles('admin')
  @ApiOperation({ summary: 'Generate monthly KPI snapshot manually' })
  async generateMonthly() {
    await this.kpiService.generateMonthlySnapshot();
    return { message: 'Monthly snapshot generated successfully' };
  }
}
