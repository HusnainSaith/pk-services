import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FamilyMembersController } from './family-members.controller';
import { FamilyMembersService } from './family-members.service';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserPermission } from './entities/user-permission.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Role } from '../roles/entities/role.entity';
import { SharedModule } from '../shared/shared.module';
import { GuardsModule } from '../../common/modules/guards.module';
import { StorageService } from '../../common/services/storage.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserPermission,
      FamilyMember,
      Role,
    ]),
    SharedModule,
    GuardsModule,
    AwsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7h' },
    }),
  ],
  controllers: [UsersController, FamilyMembersController],
  providers: [UsersService, FamilyMembersService, StorageService],
  exports: [UsersService, FamilyMembersService, TypeOrmModule],
})
export class UsersModule {}
