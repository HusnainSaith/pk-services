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

  @Column({ length: 16, nullable: true, name: 'fiscal_code' })
  fiscalCode: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 10, nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ length: 2, nullable: true })
  province: string;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: Date;

  @Column({ length: 100, nullable: true, name: 'birth_place' })
  birthPlace: string;

  @Column({ default: false, name: 'gdpr_consent' })
  gdprConsent: boolean;

  @Column({ nullable: true, name: 'gdpr_consent_date' })
  gdprConsentDate: Date;

  @Column({ default: false, name: 'privacy_consent' })
  privacyConsent: boolean;

  @Column({ nullable: true, name: 'privacy_consent_date' })
  privacyConsentDate: Date;

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