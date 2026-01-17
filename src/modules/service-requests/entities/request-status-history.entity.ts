import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ServiceRequest } from './service-request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('request_status_history')
export class RequestStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_request_id' })
  serviceRequestId: string;

  @ManyToOne(() => ServiceRequest, (request) => request.statusHistory)
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest: ServiceRequest;

  @Column({ length: 20, nullable: true, name: 'from_status' })
  fromStatus: string;

  @Column({ length: 20, name: 'to_status' })
  toStatus: string;

  @Column({ name: 'changed_by_id' })
  changedById: string;

  @ManyToOne(() => User, (user) => user.statusChanges)
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
