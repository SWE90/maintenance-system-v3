import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SparePartsService } from './spare-parts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Spare Parts')
@Controller('spare-parts')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get()
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get all spare parts' })
  async getAll(
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    const filters: any = {};

    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (supplierId) filters.supplierId = parseInt(supplierId);
    if (search) filters.search = search;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (lowStock !== undefined) filters.lowStock = lowStock === 'true';

    return this.sparePartsService.getAll(filters);
  }

  @Get('low-stock')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get low stock items' })
  async getLowStock() {
    return this.sparePartsService.getLowStockItems();
  }

  @Get('inventory-value')
  // @Roles('admin')
  @ApiOperation({ summary: 'Get total inventory value' })
  async getInventoryValue() {
    return this.sparePartsService.getInventoryValue();
  }

  @Get(':id')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Get spare part by ID' })
  async getById(@Param('id') id: string) {
    return this.sparePartsService.getById(parseInt(id));
  }

  @Post()
  // @Roles('admin')
  @ApiOperation({ summary: 'Create new spare part' })
  async create(@Body() data: any) {
    return this.sparePartsService.create(data);
  }

  @Patch(':id')
  // @Roles('admin')
  @ApiOperation({ summary: 'Update spare part' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.sparePartsService.update(parseInt(id), data);
  }

  @Post(':id/stock')
  // @Roles('admin', 'technician')
  @ApiOperation({ summary: 'Update stock quantity' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('operation') operation: 'add' | 'subtract',
  ) {
    return this.sparePartsService.updateStock(parseInt(id), quantity, operation);
  }

  @Delete(':id')
  // @Roles('admin')
  @ApiOperation({ summary: 'Delete spare part (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.sparePartsService.delete(parseInt(id));
  }
}
