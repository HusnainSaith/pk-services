import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  async getDashboard(): Promise<any> {
    const [totalUsers, totalRequests, totalAppointments, activeSubscriptions] =
      await Promise.all([
        this.userRepository.count(),
        this.serviceRequestRepository.count(),
        this.appointmentRepository.count(),
        this.userSubscriptionRepository.count({ where: { status: 'active' } }),
      ]);

    const totalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      success: true,
      data: {
        totalUsers,
        totalRequests,
        totalAppointments,
        activeSubscriptions,
        totalRevenue: parseFloat(totalRevenue?.total || 0),
      },
    };
  }

  async getServiceRequestMetrics(): Promise<any> {
    const [byStatus, byType] = await Promise.all([
      this.serviceRequestRepository
        .createQueryBuilder('sr')
        .select('sr.status', 'status')
        .addSelect('COUNT(sr.id)', 'count')
        .groupBy('sr.status')
        .getRawMany(),
      this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .select('st.name', 'type')
        .addSelect('COUNT(sr.id)', 'count')
        .groupBy('st.name')
        .getRawMany(),
    ]);

    return {
      success: true,
      data: {
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: parseInt(s.count),
        })),
        byType: byType.map((t) => ({ type: t.type, count: parseInt(t.count) })),
      },
    };
  }

  async getRevenueReports(): Promise<any> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [revenueToday, revenueMonth, revenueYear, paymentMethods] =
      await Promise.all([
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('DATE(payment.createdAt) = CURRENT_DATE')
          .andWhere('payment.status = :status', { status: 'completed' })
          .getRawOne(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('payment.createdAt >= :start', { start: monthStart })
          .andWhere('payment.status = :status', { status: 'completed' })
          .getRawOne(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('payment.createdAt >= :start', { start: yearStart })
          .andWhere('payment.status = :status', { status: 'completed' })
          .getRawOne(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('payment.paymentMethod', 'method')
          .addSelect('COUNT(payment.id)', 'count')
          .addSelect('SUM(payment.amount)', 'total')
          .where('payment.status = :status', { status: 'completed' })
          .groupBy('payment.paymentMethod')
          .getRawMany(),
      ]);

    return {
      success: true,
      data: {
        today: parseFloat(revenueToday?.total || 0),
        thisMonth: parseFloat(revenueMonth?.total || 0),
        thisYear: parseFloat(revenueYear?.total || 0),
        byMethod: paymentMethods.map((m) => ({
          method: m.method,
          count: parseInt(m.count),
          total: parseFloat(m.total || 0),
        })),
      },
    };
  }

  async getUserStatistics(): Promise<any> {
    const [total, active, byRole] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .select('role.name', 'role')
        .addSelect('COUNT(user.id)', 'count')
        .groupBy('role.name')
        .getRawMany(),
    ]);

    return {
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        byRole: byRole.map((r) => ({ role: r.role, count: parseInt(r.count) })),
      },
    };
  }

  async getAppointmentAnalytics(): Promise<any> {
    const [total, completed, cancelled, byStatus] = await Promise.all([
      this.appointmentRepository.count(),
      this.appointmentRepository.count({ where: { status: 'completed' } }),
      this.appointmentRepository.count({ where: { status: 'cancelled' } }),
      this.appointmentRepository
        .createQueryBuilder('apt')
        .select('apt.status', 'status')
        .addSelect('COUNT(apt.id)', 'count')
        .groupBy('apt.status')
        .getRawMany(),
    ]);

    return {
      success: true,
      data: {
        total,
        completed,
        cancelled,
        completionRate: ((completed / (total || 1)) * 100).toFixed(2),
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: parseInt(s.count),
        })),
      },
    };
  }

  async exportReportData(): Promise<any> {
    // Use query builders with select to limit fields and improve performance
    const [users, requests, appointments, payments] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select([
          'user.id',
          'user.fullName',
          'user.email',
          'user.isActive',
          'user.createdAt',
          'role.name',
        ])
        .getMany(),
      this.serviceRequestRepository
        .createQueryBuilder('request')
        .leftJoin('request.user', 'user')
        .leftJoin('request.serviceType', 'serviceType')
        .select([
          'request.id',
          'request.status',
          'request.priority',
          'request.createdAt',
          'user.fullName',
          'serviceType.name',
        ])
        .getMany(),
      this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoin('appointment.user', 'user')
        .select([
          'appointment.id',
          'appointment.scheduledDate',
          'appointment.status',
          'user.fullName',
        ])
        .getMany(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.user', 'user')
        .select([
          'payment.id',
          'payment.amount',
          'payment.status',
          'payment.createdAt',
          'user.fullName',
        ])
        .getMany(),
    ]);

    return {
      success: true,
      data: {
        users,
        requests,
        appointments,
        payments,
        exportedAt: new Date(),
      },
    };
  }

  // Extended Reports
  async getSubscriptionMetrics(): Promise<any> {
    const [total, active] = await Promise.all([
      this.userSubscriptionRepository.count(),
      this.userSubscriptionRepository.count({ where: { status: 'active' } }),
    ]);

    const mrr = await this.userSubscriptionRepository
      .createQueryBuilder('us')
      .leftJoinAndSelect('us.plan', 'plan')
      .select('COALESCE(SUM(plan.priceMonthly), 0)', 'total')
      .where('us.status = :status', { status: 'active' })
      .getRawOne();

    const churnRate =
      total > 0
        ? ((await this.userSubscriptionRepository.count({
            where: { status: 'cancelled' },
          })) /
            total) *
          100
        : 0;

    return {
      success: true,
      data: {
        totalSubscriptions: total,
        activeSubscriptions: active,
        churnRate: parseFloat(churnRate.toFixed(2)),
        monthlyRecurringRevenue: parseFloat(mrr?.total || 0),
        averageRevenuePerUser:
          total > 0 ? parseFloat(((mrr?.total || 0) / total).toFixed(2)) : 0,
      },
    };
  }

  async getUserActivityMetrics(): Promise<any> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .where('DATE(user.updatedAt) = CURRENT_DATE')
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.updatedAt >= :date', { date: weekAgo })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.updatedAt >= :date', { date: monthAgo })
        .getCount(),
    ]);

    return {
      success: true,
      data: {
        dailyActiveUsers: dailyActive,
        weeklyActiveUsers: weeklyActive,
        monthlyActiveUsers: monthlyActive,
        averageSessionDuration: 25,
        topFeatures: [
          {
            feature: 'Service Requests',
            usage: await this.serviceRequestRepository.count(),
          },
          {
            feature: 'Appointments',
            usage: await this.appointmentRepository.count(),
          },
          { feature: 'Documents', usage: 70 },
        ],
      },
    };
  }

  // Admin Dashboard Methods
  async getAdminDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalServiceRequests, pendingRequests, completedToday] =
      await Promise.all([
        this.userRepository.count(),
        this.serviceRequestRepository.count(),
        this.serviceRequestRepository.count({ where: { status: 'submitted' } }),
        this.serviceRequestRepository.count({
          where: {
            status: 'completed',
          },
        }),
      ]);

    const revenueToday = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('DATE(payment.createdAt) = CURRENT_DATE')
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      success: true,
      data: {
        totalUsers,
        totalServiceRequests,
        pendingRequests,
        completedToday,
        revenue: {
          today: parseFloat(revenueToday?.total || 0),
        },
      },
    };
  }

  async getPendingRequestsCount(): Promise<any> {
    const [byPriority, byType, total] = await Promise.all([
      this.serviceRequestRepository
        .createQueryBuilder('sr')
        .select('sr.priority', 'priority')
        .addSelect('COUNT(sr.id)', 'count')
        .where('sr.status IN (:...statuses)', {
          statuses: ['submitted', 'missing_documents'],
        })
        .groupBy('sr.priority')
        .getRawMany(),
      this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .select('st.name', 'type')
        .addSelect('COUNT(sr.id)', 'count')
        .where('sr.status IN (:...statuses)', {
          statuses: ['submitted', 'missing_documents'],
        })
        .groupBy('st.name')
        .getRawMany(),
      this.serviceRequestRepository.count({
        where: [{ status: 'submitted' }, { status: 'missing_documents' }],
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        byPriority: byPriority.reduce((acc, p) => {
          acc[p.priority.toLowerCase()] = parseInt(p.count);
          return acc;
        }, {}),
        byType: byType.reduce((acc, t) => {
          acc[t.type.toLowerCase()] = parseInt(t.count);
          return acc;
        }, {}),
      },
    };
  }

  async getOperatorWorkload(): Promise<any> {
    const operators = await this.serviceRequestRepository
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.assignedOperator', 'operator')
      .select('operator.id', 'id')
      .addSelect('operator.fullName', 'name')
      .addSelect(
        'COUNT(CASE WHEN sr.status IN (:...statuses) THEN 1 END)',
        'assignedRequests',
      )
      .addSelect(
        'COUNT(CASE WHEN sr.status = :completed THEN 1 END)',
        'completedToday',
      )
      .where('operator.id IS NOT NULL')
      .setParameters({
        statuses: ['submitted', 'in_review'],
        completed: 'completed',
      })
      .groupBy('operator.id')
      .addGroupBy('operator.fullName')
      .getRawMany();

    const totalWorkload = operators.reduce(
      (sum, op) => sum + parseInt(op.assignedRequests || 0),
      0,
    );
    const averageWorkload =
      operators.length > 0 ? totalWorkload / operators.length : 0;

    return {
      success: true,
      data: {
        operators: operators.map((op) => ({
          id: op.id,
          name: op.name,
          assignedRequests: parseInt(op.assignedRequests || 0),
          completedToday: parseInt(op.completedToday || 0),
          workloadPercentage:
            averageWorkload > 0
              ? parseFloat(
                  (
                    (parseInt(op.assignedRequests || 0) / totalWorkload) *
                    100
                  ).toFixed(2),
                )
              : 0,
        })),
        averageWorkload: parseFloat(averageWorkload.toFixed(2)),
      },
    };
  }
}
