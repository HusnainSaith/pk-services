import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ nullable: true, name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string;

  @Column({ length: 255, nullable: true, name: 'stripe_payment_intent_id' })
  stripePaymentIntentId: string;

  @Column({ length: 255, nullable: true, name: 'stripe_charge_id' })
  stripeChargeId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true, name: 'paid_at' })
  paidAt: Date;

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSubscription, (subscription) => subscription.payments)
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscription;

  @OneToMany(() => Invoice, (invoice) => invoice.payment)
  invoices: Invoice[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
