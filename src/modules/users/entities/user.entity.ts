import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { UserProfile } from './user-profile.entity';
import { FamilyMember } from './family-member.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => FamilyMember, (familyMember) => familyMember.user)
  familyMembers: FamilyMember[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => UserSubscription, (subscription) => subscription.user)
  subscriptions: UserSubscription[];

  // Virtual properties for relationships that don't exist yet
  permissions?: any[];
  appointments?: any[];
  operatorAppointments?: any[];
  auditLogs?: any[];
  authoredContent?: any[];
  courseEnrollments?: any[];
  instructedCourses?: any[];
  notifications?: any[];
  payments?: any[];
  serviceRequests?: any[];
  assignedRequests?: any[];
  statusChanges?: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
