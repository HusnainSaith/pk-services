import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ length: 10, default: 'monthly', name: 'billing_cycle' })
  billingCycle: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ nullable: true, name: 'end_date' })
  endDate: Date;

  @Column({ default: true, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ length: 255, nullable: true, name: 'stripe_subscription_id' })
  stripeSubscriptionId: string;

  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
