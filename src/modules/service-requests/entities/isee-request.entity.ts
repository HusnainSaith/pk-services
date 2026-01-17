import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceRequest } from './service-request.entity';

@Entity('isee_requests')
export class IseeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_request_id' })
  serviceRequestId: string;

  // Nucleo Familiare
  @Column({ type: 'jsonb', nullable: true, name: 'family_members' })
  familyMembers: Array<{
    name: string;
    fiscalCode: string;
    relationship: string;
    birthDate: Date;
    cohabiting: boolean;
  }>;

  // Abitazione (Residence)
  @Column({ type: 'text', nullable: true, name: 'residence_address' })
  residenceAddress: string;

  @Column({ type: 'text', nullable: true, name: 'municipality' })
  municipality: string;

  @Column({ length: 10, nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ type: 'text', nullable: true, name: 'property_type' })
  propertyType: string;

  // Redditi (Income - 2 anni precedenti)
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'income_year_1',
  })
  incomeYear1: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'income_year_2',
  })
  incomeYear2: number;

  @Column({ type: 'jsonb', nullable: true, name: 'income_sources' })
  incomeSources: Array<{
    type: string; // 'employment', 'self-employed', 'pension', etc.
    amount: number;
    year: number;
  }>;

  // Patrimonio Mobiliare (Movable Assets)
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'bank_accounts',
  })
  bankAccounts: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'investments',
  })
  investments: number;

  @Column({ type: 'jsonb', nullable: true, name: 'other_movable_assets' })
  otherMovableAssets: any;

  // Veicoli (Vehicles)
  @Column({ type: 'jsonb', nullable: true, name: 'vehicles' })
  vehicles: Array<{
    licensePlate: string;
    registrationYear: number;
    type: string;
  }>;

  // Disabilità (Disability)
  @Column({ type: 'boolean', nullable: true, name: 'has_disability' })
  hasDisability: boolean;

  @Column({ type: 'text', nullable: true, name: 'disability_type' })
  disabilityType: string;

  @Column({ type: 'text', nullable: true, name: 'disability_percentage' })
  disabilityPercentage: string;

  // Università (University)
  @Column({ type: 'jsonb', nullable: true, name: 'university_students' })
  universityStudents: Array<{
    name: string;
    university: string;
    degree: string;
  }>;

  // Minori / Genitori Non Conviventi (Minors / Non-cohabiting Parents)
  @Column({ type: 'jsonb', nullable: true, name: 'minors' })
  minors: Array<{
    name: string;
    birthDate: Date;
    parentalStatus: string;
  }>;

  // Document List
  @Column({ type: 'jsonb', nullable: true, name: 'documents_checklist' })
  documentsChecklist: Array<{
    documentType: string;
    status: 'pending' | 'uploaded' | 'approved' | 'rejected';
    mandatory: boolean;
  }>;

  @ManyToOne(() => ServiceRequest, (request) => request.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest: ServiceRequest;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
