import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '@maintenance/shared';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all technicians
   * Endpoint: GET /users/technicians
   */
  @Get('technicians')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async getTechnicians() {
    return this.usersService.getTechnicians();
  }

  /**
   * Get all users with filters
   * Endpoint: GET /users
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async getUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.getUsers({ role, status, city, search });
  }

  /**
   * Get user statistics
   * Endpoint: GET /users/stats
   */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  /**
   * Get user by ID
   * Endpoint: GET /users/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  /**
   * Create technician
   * Endpoint: POST /users/technicians
   */
  @Post('technicians')
  @Roles(UserRole.ADMIN)
  async createTechnician(
    @Body()
    body: {
      name: string;
      nameAr?: string;
      email?: string;
      phone?: string;
      password: string;
      employeeId?: string;
      specializations?: string[];
      serviceAreas?: string[];
    },
  ) {
    return this.usersService.createTechnician(body);
  }

  /**
   * Update user
   * Endpoint: PATCH /users/:id
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
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
    return this.usersService.updateUser(id, body);
  }

  /**
   * Delete user (soft delete)
   * Endpoint: DELETE /users/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
