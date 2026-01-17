import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RegisterDto } from './dto/register.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto, PasswordResetDto } from './dto/refresh-token.dto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { BlacklistedToken } from './entities/blacklisted-token.entity';

import { SafeLogger } from '../../common/utils/logger.util';
import { ValidationUtil } from '../../common/utils/validation.util';
type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(BlacklistedToken)
    private readonly blacklistedTokenRepository: Repository<BlacklistedToken>,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ success: boolean; message: string; user: UserWithoutPassword }> {
    ValidationUtil.validateEmail(dto.email);
    ValidationUtil.validatePassword(dto.password);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    // Find the default "customer" role
    const customerRole = await this.rolesService.findByName('customer');
    if (!customerRole) {
      throw new NotFoundException(
        'Default customer role not found. Please contact administrator.',
      );
    }

    const userResponse = await this.usersService.create({
      email: ValidationUtil.sanitizeString(dto.email.toLowerCase()),
      password: dto.password,
      fullName: `${ValidationUtil.sanitizeString(dto.firstName)} ${ValidationUtil.sanitizeString(dto.lastName)}`,
      phone: dto.phone,
      roleId: customerRole.id,
      // Profile fields
      fiscalCode: dto.fiscalCode,
      birthDate: dto.dateOfBirth,
      address: dto.address,
      city: dto.city,
      postalCode: dto.postalCode,
      province: dto.province,
      gdprConsent: dto.gdprConsent,
      privacyConsent: dto.marketingConsent,
    });

    SafeLogger.log(`User registered successfully: ${dto.email}`, 'AuthService');
    const userData = userResponse.data || (userResponse as any);
    const { ...userWithoutPassword } = userData;

    return {
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, {
      includePassword: true,
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(
    dto: LoginDto | AuthCredentialsDto,
  ): Promise<{ success: boolean; message: string; data: LoginResponseDto }> {
    ValidationUtil.validateEmail(dto.email);
    ValidationUtil.validateString(dto.password, 'password', 1);

    const user = await this.usersService.findByEmail(
      dto.email.toLowerCase().trim(),
      {
        includePassword: true,
      },
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Revoke all existing refresh tokens for this user
    await this.refreshTokenRepository.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true },
    );

    const userSafe = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    };
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7h',
    });
    const refreshToken = await this.generateRefreshToken(user.id);

    SafeLogger.log(`User logged in successfully: ${dto.email}`, 'AuthService');
    return {
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken: refreshToken.token, user: userSafe },
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{
    success: boolean;
    message: string;
    data: { accessToken: string; refreshToken: string };
  }> {
    ValidationUtil.validateString(dto.refreshToken, 'refreshToken');

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke all existing refresh tokens for this user to force re-login on other devices
    await this.refreshTokenRepository.update(
      { userId: refreshToken.user.id, isRevoked: false },
      { isRevoked: true },
    );

    const payload = {
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7h',
    });

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      refreshToken.user.id,
    );

    SafeLogger.log(
      `Token refreshed for user: ${refreshToken.user.email}`,
      'AuthService',
    );
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken, refreshToken: newRefreshToken.token },
    };
  }

  async logout(
    userId: string,
    accessToken?: string,
  ): Promise<{ success: boolean; message: string }> {
    // Blacklist the current access token
    if (accessToken) {
      await this.blacklistToken(accessToken);
    }

    // Revoke all refresh tokens for this user
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    SafeLogger.log(`User logged out successfully: ${userId}`, 'AuthService');
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string; token?: string }> {
    ValidationUtil.validateEmail(dto.email);

    const user = await this.usersService.findByEmail(
      dto.email.toLowerCase().trim(),
    );
    if (!user) {
      throw new NotFoundException('No user found with this email address');
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    SafeLogger.log(
      `Password reset token generated for: ${dto.email}`,
      'AuthService',
    );
    SafeLogger.log(`Reset token: ${resetToken}`, 'AuthService');

    return {
      success: true,
      message:
        'Password reset token generated successfully. Check server logs for token.',
      token: resetToken, // Remove in production
    };
  }

  async requestPasswordReset(
    dto: PasswordResetDto,
  ): Promise<{ success: boolean; message: string; token?: string }> {
    return this.forgotPassword(dto);
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    ValidationUtil.validateString(dto.token, 'token');
    ValidationUtil.validatePassword(dto.password);

    try {
      const payload = await this.jwtService.verifyAsync(dto.token);
      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      await this.usersService.updatePassword(payload.sub, hashedPassword);
      await this.refreshTokenRepository.update(
        { userId: payload.sub },
        { isRevoked: true },
      );

      SafeLogger.log(
        `Password reset successful for user ID: ${payload.sub}`,
        'AuthService',
      );
      return {
        success: true,
        message:
          'Password has been changed successfully. Please login with your new password.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user with password for comparison
    const userWithPassword =
      await this.usersService.findByIdWithPassword(userId);
    if (!userWithPassword) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      userWithPassword.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async getMe(
    userId: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    const user = await this.usersService.findOne(userId);
    const { ...userWithoutPassword } = user as any;
    return {
      success: true,
      message: 'User details retrieved successfully',
      data: userWithoutPassword,
    };
  }

  async getCurrentUser(
    userId: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    return this.getMe(userId);
  }

  async getCurrentUserByEmail(email: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  private async generateRefreshToken(userId: string): Promise<RefreshToken> {
    const token = await this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async getUserWithDetails(userId: string) {
    return this.usersService.findOneWithPermissions(userId);
  }

  private async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);

        const blacklistedToken = this.blacklistedTokenRepository.create({
          token,
          expiresAt,
        });

        await this.blacklistedTokenRepository.save(blacklistedToken);
      }
    } catch (error) {
      // Token might be invalid, ignore
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.blacklistedTokenRepository.findOne({
      where: { token },
    });
    return !!blacklisted;
  }
}
