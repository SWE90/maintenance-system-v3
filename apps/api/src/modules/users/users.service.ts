import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '@maintenance/shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all technicians
   */
  async getTechnicians() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.TECHNICIAN,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        email: true,
        phone: true,
        employeeId: true,
        specializations: true,
        serviceAreas: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameAr: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        employeeId: true,
        department: true,
        avatar: true,
        address: true,
        city: true,
        district: true,
        lat: true,
        lng: true,
        specializations: true,
        serviceAreas: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get all users with filters
   */
  async getUsers(filters?: {
    role?: UserRole;
    status?: UserStatus;
    city?: string;
    search?: string;
  }) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { employeeId: { contains: filters.search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameAr: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        employeeId: true,
        department: true,
        city: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Create technician
   */
  async createTechnician(data: {
    name: string;
    nameAr?: string;
    email?: string;
    phone?: string;
    password: string;
    employeeId?: string;
    specializations?: string[];
    serviceAreas?: string[];
  }) {
    // Check if email or phone already exists
    if (data.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (data.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new BadRequestException('Phone already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: UserRole.TECHNICIAN,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        email: true,
        phone: true,
        employeeId: true,
        specializations: true,
        serviceAreas: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update user
   */
  async updateUser(
    id: number,
    data: {
      name?: string;
      nameAr?: string;
      email?: string;
      phone?: string;
      status?: UserStatus;
      department?: string;
      specializations?: string[];
      serviceAreas?: string[];
      isAvailable?: boolean;
      avatar?: string;
      address?: string;
      city?: string;
      district?: string;
      lat?: number;
      lng?: number;
    },
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness
    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check phone uniqueness
    if (data.phone && data.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw new BadRequestException('Phone already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        nameAr: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        employeeId: true,
        department: true,
        specializations: true,
        serviceAreas: true,
        isAvailable: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });

    return { success: true };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [total, active, technicians, customers] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { role: UserRole.TECHNICIAN, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, deletedAt: null },
      }),
    ]);

    return {
      total,
      active,
      technicians,
      customers,
    };
  }
}
