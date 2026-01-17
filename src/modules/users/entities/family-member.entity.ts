import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.familyMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'fiscal_code', unique: true })
  fiscalCode: string;

  @Column()
  relationship: string; // coniuge, figlio, genitore, fratello, sorella, altro

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @Column({ name: 'is_dependent', default: false })
  isDependent: boolean;

  @Column({ default: false })
  disability: boolean;

  @Column({ name: 'disability_type', nullable: true })
  disabilityType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
