import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceRequest } from './service-request.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('service_types')
export class ServiceType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'base_price',
  })
  basePrice: number;

  @Column({ type: 'jsonb', nullable: true, name: 'required_documents' })
  requiredDocuments: any;

  @Column({ type: 'jsonb', nullable: true, name: 'form_schema' })
  formSchema: any;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => ServiceRequest, (request) => request.serviceType)
  requests: ServiceRequest[];

  @OneToMany(() => Appointment, (appointment) => appointment.serviceType)
  appointments: Appointment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
