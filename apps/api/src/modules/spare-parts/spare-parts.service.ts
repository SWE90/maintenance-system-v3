import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SparePartsService {
  private readonly logger = new Logger(SparePartsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all spare parts with filters
   */
  async getAll(filters?: {
    categoryId?: number;
    supplierId?: number;
    search?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }) {
    const where: Prisma.SparePartWhereInput = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { nameAr: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.lowStock) {
      where.AND = [
        { quantity: { lte: this.prisma.sparePart.fields.minQuantity } },
      ];
    }

    return this.prisma.sparePart.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Get spare part by ID
   */
  async getById(id: number) {
    const part = await this.prisma.sparePart.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!part) {
      throw new NotFoundException('قطعة الغيار غير موجودة');
    }

    return part;
  }

  /**
   * Create spare part
   */
  async create(data: Prisma.SparePartCreateInput) {
    // Check if code already exists
    const existing = await this.prisma.sparePart.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException('رمز قطعة الغيار موجود مسبقاً');
    }

    return this.prisma.sparePart.create({
      data,
      include: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Update spare part
   */
  async update(id: number, data: Prisma.SparePartUpdateInput) {
    const part = await this.prisma.sparePart.findUnique({ where: { id } });

    if (!part) {
      throw new NotFoundException('قطعة الغيار غير موجودة');
    }

    return this.prisma.sparePart.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
      },
    });
  }

  /**
   * Delete spare part (soft delete)
   */
  async delete(id: number) {
    const part = await this.prisma.sparePart.findUnique({ where: { id } });

    if (!part) {
      throw new NotFoundException('قطعة الغيار غير موجودة');
    }

    await this.prisma.sparePart.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  /**
   * Update stock quantity
   */
  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract') {
    const part = await this.getById(id);

    const newQuantity = operation === 'add'
      ? part.quantity + quantity
      : part.quantity - quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('الكمية غير كافية في المخزون');
    }

    const updated = await this.prisma.sparePart.update({
      where: { id },
      data: { quantity: newQuantity },
    });

    // Check if low stock
    if (newQuantity <= part.minQuantity) {
      this.logger.warn(`Low stock alert: ${part.code} - Quantity: ${newQuantity}`);
      // TODO: Send notification
    }

    return updated;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    return this.prisma.$queryRaw`
      SELECT sp.*, spc.name_en as category_name
      FROM spare_parts sp
      JOIN spare_part_categories spc ON sp.category_id = spc.id
      WHERE sp.quantity <= sp.min_quantity
        AND sp.is_active = true
      ORDER BY (sp.quantity / sp.min_quantity) ASC
    `;
  }

  /**
   * Get inventory value
   */
  async getInventoryValue() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT
        SUM(quantity * unit_price::numeric) as total_value,
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity
      FROM spare_parts
      WHERE is_active = true
    `;

    return result[0] || { total_value: 0, total_items: 0, total_quantity: 0 };
  }
}
