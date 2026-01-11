import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('invoices')
@Index(['userId'])
@Index(['paymentId'])
@Index(['stripeInvoiceId'])
@Index(['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id' })
  paymentId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 255, nullable: true, name: 'stripe_invoice_id' })
  stripeInvoiceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ length: 20, default: 'draft' })
  // draft | sent | paid | void | uncollectible
  status: string;

  @Column({ type: 'text', nullable: true, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ type: 'text', nullable: true, name: 'pdf_url' })
  pdfUrl: string;

  @Column({ type: 'text', nullable: true, name: 'pdf_path' })
  pdfPath: string;

  @Column({ type: 'jsonb', nullable: true })
  lineItems: Array<{
    description: string;
    quantity: number;
    amount: number;
    currency: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  billing: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    fiscalCode?: string;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true, name: 'issued_at' })
  issuedAt: Date;

  @Column({ nullable: true, name: 'paid_at' })
  paidAt: Date;

  @Column({ nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ManyToOne(() => Payment, (payment) => payment.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
