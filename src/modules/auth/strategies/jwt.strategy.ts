import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedToken } from '../entities/blacklisted-token.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    @InjectRepository(BlacklistedToken)
    private blacklistedTokenRepository: Repository<BlacklistedToken>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      // Check token expiration manually
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new UnauthorizedException('Token has expired');
      }

      // Check if token is blacklisted
      const blacklisted = await this.blacklistedTokenRepository.findOne({
        where: { token },
      });

      if (blacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      const user = await this.usersService.findOneWithPermissions(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token - user not found');
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions || [],
        token, // Include current token
      };
    } catch (error) {
      console.error('JWT Strategy validation error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
