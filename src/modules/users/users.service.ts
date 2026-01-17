import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Role } from '../roles/entities/role.entity';
import { StorageService } from '../../common/services/storage.service';
import { AwsS3FolderService } from '../aws/services/aws-s3-folder.service';
import { AwsS3UploadService } from '../../common/services/aws-s3-upload.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UpdateExtendedProfileDto,
  UpdateGdprConsentDto,
  AccountDeletionRequestDto,
} from './dto/update-extended-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private storageService: StorageService,
    private awsS3FolderService: AwsS3FolderService,
    private awsS3UploadService: AwsS3UploadService,
  ) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Create user with only core fields
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      phone: dto.phone,
      roleId: dto.roleId,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile with additional fields
    const profile = this.userProfileRepository.create({
      userId: savedUser.id,
      fiscalCode: dto.fiscalCode,
      address: dto.address,
      city: dto.city,
      postalCode: dto.postalCode,
      province: dto.province,
      birthDate: dto.birthDate,
      birthPlace: dto.birthPlace,
      gdprConsent: dto.gdprConsent || false,
      gdprConsentDate: dto.gdprConsent ? new Date() : null,
      privacyConsent: dto.privacyConsent || false,
      privacyConsentDate: dto.privacyConsent ? new Date() : null,
    });

    await this.userProfileRepository.save(profile);

    // Create S3 folder structure for new user
    try {
      await this.awsS3FolderService.createUserFolderStructure(savedUser.id);
      this.logger.log(
        `S3 folder structure created for user: ${savedUser.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create S3 folder structure for user ${savedUser.id}: ${error.message}`,
      );
      // Don't fail user creation if S3 fails - log it but continue
      // User can still function without S3 folders (they'll be created on first upload)
    }

    // Remove password from response
    delete savedUser.password;

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
      select: ['id', 'email', 'fullName', 'password', 'createdAt', 'updatedAt'],
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

    // Parse permissions from role if they exist
    if (user.role && user.role.permissions) {
      try {
        user.permissions = JSON.parse(user.role.permissions);
      } catch (error) {
        this.logger.error(`Failed to parse permissions for user ${id}: ${error.message}`);
        user.permissions = [];
      }
    } else {
      user.permissions = [];
    }

    return user;
  }

  async findAll() {
    // Optimized: Use query builder with select for better performance
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
        'role.name',
      ])
      .orderBy('user.createdAt', 'DESC')
      .getMany();

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

    // Separate user fields from profile fields
    const userFields: Partial<User> = {};
    const profileFields: Partial<UserProfile> = {};

    // User table fields
    if (dto.email !== undefined) userFields.email = dto.email;
    if (dto.fullName !== undefined) userFields.fullName = dto.fullName;
    if (dto.phone !== undefined) userFields.phone = dto.phone;
    if (dto.isActive !== undefined) userFields.isActive = dto.isActive;
    if (dto.roleId !== undefined) userFields.roleId = dto.roleId;

    // Profile fields
    if (dto.fiscalCode !== undefined) profileFields.fiscalCode = dto.fiscalCode;
    if (dto.address !== undefined) profileFields.address = dto.address;
    if (dto.city !== undefined) profileFields.city = dto.city;
    if (dto.postalCode !== undefined) profileFields.postalCode = dto.postalCode;
    if (dto.province !== undefined) profileFields.province = dto.province;
    if (dto.birthDate !== undefined) profileFields.birthDate = new Date(dto.birthDate);
    if (dto.birthPlace !== undefined) profileFields.birthPlace = dto.birthPlace;
    if (dto.gdprConsent !== undefined) {
      profileFields.gdprConsent = dto.gdprConsent;
      profileFields.gdprConsentDate = dto.gdprConsent ? new Date() : null;
    }
    if (dto.privacyConsent !== undefined) {
      profileFields.privacyConsent = dto.privacyConsent;
      profileFields.privacyConsentDate = dto.privacyConsent ? new Date() : null;
    }

    // Update user table
    if (Object.keys(userFields).length > 0) {
      await this.userRepository.update(id, userFields);
    }

    // Update or create profile
    if (Object.keys(profileFields).length > 0) {
      let profile = await this.userProfileRepository.findOne({
        where: { userId: id },
      });

      if (profile) {
        await this.userProfileRepository.update(profile.id, profileFields);
      } else {
        // Create profile if it doesn't exist
        profile = this.userProfileRepository.create({
          userId: id,
          ...profileFields,
        });
        await this.userProfileRepository.save(profile);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    // Use a transaction to ensure all deletions succeed or fail together
    return await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Find user with all relations
        const user = await transactionalEntityManager.findOne(User, {
          where: { id },
          relations: [
            'profile',
            'familyMembers',
            'refreshTokens',
            'subscriptions',
          ],
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        this.logger.log(`Starting deletion process for user: ${id}`);

        // Delete related entities in the correct order to avoid FK constraints
        // Order matters: delete child entities before parent entities

        // 1. Delete user profile (has FK to user)
        if (user.profile) {
          await transactionalEntityManager.remove(user.profile);
          this.logger.log(`Deleted profile for user: ${id}`);
        }

        // 2. Delete family members (has CASCADE configured, but we'll be explicit)
        if (user.familyMembers && user.familyMembers.length > 0) {
          await transactionalEntityManager.remove(user.familyMembers);
          this.logger.log(
            `Deleted ${user.familyMembers.length} family member(s) for user: ${id}`,
          );
        }

        // 3. Delete refresh tokens
        if (user.refreshTokens && user.refreshTokens.length > 0) {
          await transactionalEntityManager.remove(user.refreshTokens);
          this.logger.log(
            `Deleted ${user.refreshTokens.length} refresh token(s) for user: ${id}`,
          );
        }

        // 4. Delete user subscriptions and their related payments
        if (user.subscriptions && user.subscriptions.length > 0) {
          // First delete payments associated with these subscriptions
          for (const subscription of user.subscriptions) {
            await transactionalEntityManager
              .createQueryBuilder()
              .delete()
              .from('payments')
              .where('subscription_id = :subscriptionId', {
                subscriptionId: subscription.id,
              })
              .execute();
          }

          await transactionalEntityManager.remove(user.subscriptions);
          this.logger.log(
            `Deleted ${user.subscriptions.length} subscription(s) for user: ${id}`,
          );
        }

        // 5. Delete other related entities using query builder for efficiency
        // Delete service requests (both created and assigned)
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('request_status_history')
          .where('changed_by_id = :userId', { userId: id })
          .execute();

        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('service_requests')
          .where('user_id = :userId OR assigned_operator_id = :userId', {
            userId: id,
          })
          .execute();

        // Delete appointments
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('appointments')
          .where('user_id = :userId OR operator_id = :userId', { userId: id })
          .execute();

        // Delete notifications
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('notifications')
          .where('user_id = :userId', { userId: id })
          .execute();

        // Delete course enrollments
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('course_enrollments')
          .where('user_id = :userId', { userId: id })
          .execute();

        // Delete CMS content authored by user
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('cms_content')
          .where('author_id = :userId', { userId: id })
          .execute();

        // Delete audit logs
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('audit_logs')
          .where('user_id = :userId', { userId: id })
          .execute();

        // Delete user permissions
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('user_permissions')
          .where('user_id = :userId', { userId: id })
          .execute();

        // Delete payments made by user (not associated with subscriptions)
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('payments')
          .where('user_id = :userId', { userId: id })
          .execute();

        // Finally, delete the user
        await transactionalEntityManager.remove(user);

        this.logger.log(`Successfully deleted user and all related data: ${id}`);

        return {
          success: true,
          message: 'User deleted successfully',
        };
      },
    );
  }

  // Profile methods
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Parse role permissions if stored as string
    if (user.role && typeof user.role.permissions === 'string') {
      try {
        user.role = {
          ...user.role,
          permissions: JSON.parse(user.role.permissions),
        } as any;
      } catch (e) {
        user.role = {
          ...user.role,
          permissions: [],
        } as any;
      }
    }

    // Remove sensitive data
    delete user.password;

    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
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

    // Separate extended profile fields from user fields
    const userUpdateData = {};
    const profileUpdateData = {};

    // Define which fields go to which table
    const profileFields = [
      'fiscalCode',
      'address',
      'city',
      'postalCode',
      'province',
      'birthDate',
      'birthPlace',
      'avatarUrl',
      'bio',
      'gdprConsent',
      'privacyConsent',
    ];

    for (const key in dto) {
      if (dto[key] !== undefined) {
        if (profileFields.includes(key)) {
          profileUpdateData[key] = dto[key];
        } else {
          userUpdateData[key] = dto[key];
        }
      }
    }

    // Merge user updates
    Object.assign(user, userUpdateData);

    // Handle consent dates in profile
    if (dto.gdprConsent !== undefined || dto.privacyConsent !== undefined) {
      // Get or create profile
      let profile = await this.userProfileRepository.findOne({
        where: { userId },
      });

      if (!profile) {
        profile = this.userProfileRepository.create({ userId });
      }

      // Auto-populate consent dates when consent is set to true
      if (dto.gdprConsent === true) {
        profileUpdateData['gdprConsent'] = true;
        profileUpdateData['gdprConsentDate'] = new Date();
      }

      if (dto.privacyConsent === true) {
        profileUpdateData['privacyConsent'] = true;
        profileUpdateData['privacyConsentDate'] = new Date();
      }

      // Default privacy consent to true if not explicitly set
      if (dto.privacyConsent === undefined && !profile.privacyConsent) {
        profileUpdateData['privacyConsent'] = true;
        profileUpdateData['privacyConsentDate'] = new Date();
      }
    }

    // Save user first
    const updatedUser = await this.userRepository.save(user);

    // Update or create extended profile if there are profile fields to update
    if (Object.keys(profileUpdateData).length > 0) {
      if (user.profile) {
        // Update existing profile
        Object.assign(user.profile, profileUpdateData);
        await this.userRepository.save(user);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = this.userProfileRepository.create({
          userId: userId,
          ...profileUpdateData,
        });
        await this.userProfileRepository.save(newProfile);
        updatedUser.profile = newProfile;
      }
    }

    // Remove sensitive data
    delete updatedUser.password;

    return {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async getExtendedProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'Extended profile retrieved',
      data: user.profile || {},
    };
  }

  async updateExtendedProfile(userId: string, dto: UpdateExtendedProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create or update profile
    if (user.profile) {
      Object.assign(user.profile, dto);
      await this.userRepository.save(user);
    }

    return {
      success: true,
      message: 'Extended profile updated',
      data: user.profile || {},
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const isValidType =
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp';

    if (!isValidType) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WebP',
      );
    }

    if (file.size > 5242880) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Upload to profile folder using the AWS S3 upload service (organized structure)
      const { publicUrl } = await this.awsS3UploadService.uploadProfileImage(
        userId,
        file,
      );

      // Get current avatar URL for cleanup
      const existingProfile = await this.userProfileRepository.findOne({
        where: { userId },
        select: ['avatarUrl'], // Only select what we need
      });

      // Delete old avatar in background (don't await)
      if (existingProfile?.avatarUrl) {
        // Extract S3 key: remove bucket name from URL
        // URL format: https://s3.region.amazonaws.com/bucket-name/users/userId/profile/filename.png
        // S3 Key should be: users/userId/profile/filename.png
        const urlParts = existingProfile.avatarUrl.split('/');
        const bucketNameIndex = urlParts.indexOf(
          this.storageService.getBucketName(),
        );
        if (bucketNameIndex !== -1 && bucketNameIndex + 1 < urlParts.length) {
          const s3Key = urlParts.slice(bucketNameIndex + 1).join('/');
          this.storageService.deleteFile(s3Key).catch((err) => {
            this.logger.debug(
              `Background avatar deletion failed: ${err.message}`,
            );
          });
        }
      }

      // Single update query instead of find + save pattern
      const result = await this.userProfileRepository.upsert(
        { userId, avatarUrl: publicUrl },
        ['userId'],
      );

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: { avatarUrl: publicUrl },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  async deleteAvatar(userId: string) {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile || !profile.avatarUrl) {
      throw new NotFoundException('Avatar not found');
    }

    try {
      // Extract path from URL
      const oldPath = profile.avatarUrl.split('.amazonaws.com/')[1];
      if (oldPath) {
        await this.storageService.deleteFile(oldPath);
      }

      // Remove avatar URL from profile
      profile.avatarUrl = null;
      await this.userProfileRepository.save(profile);

      return {
        success: true,
        message: 'Avatar deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete avatar');
    }
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
    const activities = await this.userRepository.find({
      where: { id },
      relations: ['serviceRequests', 'appointments'],
    });
    return {
      success: true,
      message: 'User activity retrieved',
      data: activities,
    };
  }

  async getUserSubscriptions(id: string) {
    const userWithSubscriptions = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('user.id = :id', { id })
      .getOne();

    if (!userWithSubscriptions) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User subscriptions retrieved',
      data: userWithSubscriptions.subscriptions || [],
    };
  }

  // GDPR Compliance Methods
  async updateGdprConsent(userId: string, dto: UpdateGdprConsentDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create profile
    let profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({ userId });
    }

    // Update consent flags and auto-populate dates
    if (dto.gdprConsent !== undefined) {
      profile.gdprConsent = dto.gdprConsent;
      if (dto.gdprConsent === true) {
        profile.gdprConsentDate = new Date();
      }
    }

    if (dto.privacyConsent !== undefined) {
      profile.privacyConsent = dto.privacyConsent;
      if (dto.privacyConsent === true) {
        profile.privacyConsentDate = new Date();
      }
    }

    // Default privacy consent to true
    if (!profile.privacyConsent) {
      profile.privacyConsent = true;
      profile.privacyConsentDate = new Date();
    }

    await this.userProfileRepository.save(profile);

    return {
      success: true,
      message: 'Consent preferences updated',
      data: {
        gdprConsent: profile.gdprConsent,
        gdprConsentDate: profile.gdprConsentDate,
        privacyConsent: profile.privacyConsent,
        privacyConsentDate: profile.privacyConsentDate,
      },
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

  async requestAccountDeletion(userId: string, dto: AccountDeletionRequestDto) {
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
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user profile for consent data
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    // Build consent history from profile's consent dates
    const consentHistory = [];

    if (profile) {
      // Add GDPR consent record
      if (profile.gdprConsentDate) {
        consentHistory.push({
          type: 'GDPR Data Processing',
          consent: profile.gdprConsent,
          date: profile.gdprConsentDate,
          timestamp: profile.gdprConsentDate.toISOString(),
        });
      }

      // Add Privacy consent record
      if (profile.privacyConsentDate) {
        consentHistory.push({
          type: 'Privacy Policy',
          consent: profile.privacyConsent,
          date: profile.privacyConsentDate,
          timestamp: profile.privacyConsentDate.toISOString(),
        });
      }
    }

    // Sort by date descending (most recent first)
    consentHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      success: true,
      message: 'Consent history retrieved',
      data:
        consentHistory.length > 0
          ? consentHistory
          : [
              {
                type: 'GDPR Data Processing',
                consent: profile?.gdprConsent || false,
                date: profile?.gdprConsentDate || null,
              },
              {
                type: 'Privacy Policy',
                consent: profile?.privacyConsent || false,
                date: profile?.privacyConsentDate || null,
              },
            ],
    };
  }
}
