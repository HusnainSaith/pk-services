import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Personal Information
  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 16, nullable: true, name: 'fiscal_code' })
  fiscalCode: string;

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

  // GDPR and Privacy
  @Column({ default: false, name: 'gdpr_consent' })
  gdprConsent: boolean;

  @Column({ nullable: true, name: 'gdpr_consent_date' })
  gdprConsentDate: Date;

  @Column({ default: false, name: 'privacy_consent' })
  privacyConsent: boolean;

  @Column({ nullable: true, name: 'privacy_consent_date' })
  privacyConsentDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
