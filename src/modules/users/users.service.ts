import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return {
      success: true,
      message: 'User created successfully',
      data: savedUser,
    };
  }

  async findByEmail(email: string, options?: { includePassword?: boolean }) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: email.toLowerCase().trim() });

    if (options?.includePassword) {
      queryBuilder.addSelect('user.password');
    }

    return queryBuilder.getOne();
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    return user;
  }

  async findByIdWithPassword(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'email', 'fullName', 'password', 'createdAt', 'updatedAt']
    });
    return user;
  }

  async updatePassword(userId: string, hashedPassword: string) {
    const result = await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findOneWithPermissions(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: ['role'],
      select: ['id', 'email', 'fullName', 'createdAt', 'updatedAt'],
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    await this.userRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  // Profile methods
  async getProfile(userId: string) {
    return this.findOne(userId);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.update(userId, dto);
  }

  async getExtendedProfile(userId: string) {
    return {
      success: true,
      message: 'Extended profile retrieved',
      data: {},
    };
  }

  async updateExtendedProfile(userId: string, dto: any) {
    return {
      success: true,
      message: 'Extended profile updated',
    };
  }

  async uploadAvatar(userId: string, dto: any) {
    return {
      success: true,
      message: 'Avatar uploaded',
    };
  }

  async deleteAvatar(userId: string) {
    return {
      success: true,
      message: 'Avatar deleted',
    };
  }

  async activate(id: string) {
    await this.userRepository.update(id, { isActive: true });
    return {
      success: true,
      message: 'User activated',
    };
  }

  async deactivate(id: string) {
    await this.userRepository.update(id, { isActive: false });
    return {
      success: true,
      message: 'User deactivated',
    };
  }

  async getUserActivity(id: string) {
    return {
      success: true,
      message: 'User activity retrieved',
      data: [],
    };
  }

  async getUserSubscriptions(id: string) {
    return {
      success: true,
      message: 'User subscriptions retrieved',
      data: [],
    };
  }

  // GDPR Compliance Methods
  async updateGdprConsent(userId: string, dto: any) {
    await this.userRepository.update(userId, {
      gdprConsent: dto.gdprConsent,
      gdprConsentDate: new Date(),
      privacyConsent: dto.privacyConsent,
      privacyConsentDate: new Date(),
    });

    return {
      success: true,
      message: 'Consent preferences updated',
    };
  }

  async requestDataExport(userId: string) {
    return {
      success: true,
      message: 'Data export request submitted',
      data: {
        exportId: 'export_123',
        estimatedCompletion: '24 hours',
      },
    };
  }

  async requestAccountDeletion(userId: string, dto: any) {
    return {
      success: true,
      message: 'Account deletion request submitted',
      data: {
        requestId: 'deletion_123',
        scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    };
  }

  async getConsentHistory(userId: string) {
    return {
      success: true,
      message: 'Consent history retrieved',
      data: [],
    };
  }
}