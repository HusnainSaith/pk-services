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

@Entity('modello_730_requests')
export class Modello730Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_request_id' })
  serviceRequestId: string;

  // Dati Anagrafici (Personal Data)
  @Column({ type: 'text', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'text', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'text', nullable: true, name: 'fiscal_code' })
  fiscalCode: string;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: Date;

  @Column({ type: 'text', nullable: true, name: 'birth_place' })
  birthPlace: string;

  // Redditi (Income)
  @Column({ type: 'jsonb', nullable: true, name: 'cu_data' })
  cuData: {
    employer: string;
    totalIncome: number;
    taxableIncome: number;
    taxWithheld: number;
  };

  @Column({ type: 'jsonb', nullable: true, name: 'inps_income' })
  inpsIncome: Array<{
    type: string;
    amount: number;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'other_income' })
  otherIncome: Array<{
    type: string;
    amount: number;
    description: string;
  }>;

  // Immobili (Real Estate)
  @Column({ type: 'jsonb', nullable: true, name: 'properties' })
  properties: Array<{
    address: string;
    cadastralCategory: string;
    rentIncome: number;
    mortgageInterest: number;
  }>;

  // Spese Sanitarie (Medical Expenses)
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'medical_expenses' })
  medicalExpenses: number;

  @Column({ type: 'jsonb', nullable: true, name: 'medical_details' })
  medicalDetails: Array<{
    description: string;
    amount: number;
  }>;

  // Spese Istruzione (Education Expenses)
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'education_expenses' })
  educationExpenses: number;

  @Column({ type: 'jsonb', nullable: true, name: 'education_details' })
  educationDetails: Array<{
    student: string;
    institution: string;
    amount: number;
  }>;

  // Mutui & Bonus Casa (Mortgage & Home Bonus)
  @Column({ type: 'jsonb', nullable: true, name: 'mortgages' })
  mortgages: Array<{
    lender: string;
    principalResidence: boolean;
    interest: number;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'home_bonus' })
  homeBonus: Array<{
    type: string; // 'ristrutturazioni', 'ecobonus', 'sismabonus', etc.
    amount: number;
  }>;

  // Famiglia (Family)
  @Column({ type: 'jsonb', nullable: true, name: 'dependents' })
  dependents: Array<{
    name: string;
    fiscalCode: string;
    relationship: string;
    birthDate: Date;
  }>;

  @Column({ type: 'integer', nullable: true, name: 'family_members_count' })
  familyMembersCount: number;

  // Assicurazioni & Previdenza (Insurance & Pensions)
  @Column({ type: 'jsonb', nullable: true, name: 'life_insurance' })
  lifeInsurance: Array<{
    company: string;
    premiumAmount: number;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'pension_contributions' })
  pensionContributions: Array<{
    type: string;
    amount: number;
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
