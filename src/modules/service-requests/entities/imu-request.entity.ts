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

@Entity('imu_requests')
export class ImuRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_request_id' })
  serviceRequestId: string;

  // Dati Contribuente (Taxpayer Data)
  @Column({ type: 'text', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'text', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'text', nullable: true, name: 'fiscal_code' })
  fiscalCode: string;

  @Column({ type: 'text', nullable: true, name: 'taxpayer_type' })
  taxpayerType: string; // 'individual' | 'corporate'

  @Column({ type: 'text', nullable: true, name: 'address' })
  address: string;

  @Column({ type: 'text', nullable: true, name: 'municipality' })
  municipality: string;

  @Column({ length: 10, nullable: true, name: 'postal_code' })
  postalCode: string;

  // Immobili (Properties - Multi-property support)
  @Column({ type: 'jsonb', nullable: true, name: 'properties' })
  properties: Array<{
    id?: string;
    cadastralData: {
      cadastralMunicipality: string;
      section: string;
      sheet: string;
      parcel: string;
      subparcel: string;
      cadastralCategory: string;
      cadastralClass: string;
      rentValue: number;
    };
    address: string;
    purchaseDate: Date;
    purchasePrice: number;
  }>;

  // Utilizzo Immobile (Property Use)
  @Column({ type: 'jsonb', nullable: true, name: 'property_usage' })
  propertyUsage: Array<{
    propertyId: string;
    usage: string; // 'principal_residence', 'rental', 'business', 'agricultural', 'other'
    percentage?: number;
  }>;

  // Agevolazioni (Exemptions/Benefits)
  @Column({ type: 'jsonb', nullable: true, name: 'exemptions' })
  exemptions: Array<{
    propertyId: string;
    type: string; // 'principal_residence', 'agricultural', 'heritage', 'institutional', 'other'
    description: string;
    year: number;
  }>;

  // Variazioni (Changes/Updates)
  @Column({ type: 'jsonb', nullable: true, name: 'variations' })
  variations: Array<{
    propertyId: string;
    variationType: string; // 'alienation', 'acquisition', 'structural_change', 'use_change', 'demolition'
    date: Date;
    details: string;
  }>;

  // Pagamenti IMU (IMU Payments)
  @Column({ type: 'jsonb', nullable: true, name: 'imu_payments' })
  imuPayments: Array<{
    propertyId: string;
    year: number;
    amount: number;
    dueDate: Date;
    paymentDate?: Date;
    status: 'paid' | 'unpaid' | 'partial';
  }>;

  // Successione (Inheritance - if applicable)
  @Column({ type: 'boolean', nullable: true, name: 'has_inheritance' })
  hasInheritance: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'inheritance_data' })
  inheritanceData: {
    inheritor: string;
    inheritanceDate: Date;
    inheritedProperties: Array<{
      propertyId: string;
      inheritancePercentage: number;
    }>;
  };

  // Tax Year
  @Column({ type: 'integer', nullable: true, name: 'tax_year' })
  taxYear: number;

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
