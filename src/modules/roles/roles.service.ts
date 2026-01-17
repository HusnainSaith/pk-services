import { ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * RolesService
 * Manages role CRUD operations and permissions assignment
 * Extends BaseService to reduce redundant find/create/update/delete logic
 */
export class RolesService extends BaseService<
  Role,
  CreateRoleDto,
  UpdateRoleDto
> {
  constructor(
    @InjectRepository(Role)
    protected readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(roleRepository);
  }

  /**
   * Create role with unique name validation
   */
  async create(dto: CreateRoleDto) {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Role name already exists');
    }

    return super.create(dto);
  }

  /**
   * Find all roles (wrapper for BaseService)
   */
  async findAll() {
    return super.findAll();
  }

  /**
   * Find role by ID (wrapper for BaseService)
   */
  async findOne(id: string) {
    return super.findById(id);
  }

  /**
   * Remove role (wrapper for BaseService)
   */
  async remove(id: string) {
    return super.delete(id);
  }

  /**
   * Update role with unique name validation
   */
  async update(id: string, dto: UpdateRoleDto) {
    // Verify role exists using inherited method
    await this.findById(id);

    if (dto.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Role name already exists');
      }
    }

    return super.update(id, dto);
  }

  /**
   * Find role by name
   */
  async findByName(name: string) {
    return this.roleRepository.findOne({ where: { name } });
  }

  /**
   * Get all permissions (stub - extends when permission system is fully integrated)
   */
  async findAllPermissions() {
    // TODO: Implement when Permission entity relations are set up
    return [];
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(id: string, dto: any) {
    // Verify role exists
    await this.findById(id);
    // TODO: Implement permission assignment logic
    return null;
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId: string, permissionId: string) {
    // Verify role exists
    await this.findById(roleId);
    // TODO: Implement permission removal logic
    return null;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, dto: any) {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if role exists
    const role = await this.roleRepository.findOne({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
    }

    // Assign role
    user.role = role;
    const savedUser = await this.userRepository.save(user);
    
    // Return user without password
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * Assign permission to user
   */
  async assignPermissionToUser(id: string, dto: any) {
    // Verify role exists
    await this.findById(id);
    // TODO: Implement user permission assignment
    return null;
  }
}
