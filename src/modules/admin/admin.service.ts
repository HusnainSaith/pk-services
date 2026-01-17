import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get counts from database
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

    // Get revenue data
    const revenueToday = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('DATE(payment.createdAt) = CURRENT_DATE')
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const revenueMonth = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where(
        'EXTRACT(YEAR FROM payment.createdAt) = EXTRACT(YEAR FROM CURRENT_DATE)',
      )
      .andWhere(
        'EXTRACT(MONTH FROM payment.createdAt) = EXTRACT(MONTH FROM CURRENT_DATE)',
      )
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const revenueYear = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where(
        'EXTRACT(YEAR FROM payment.createdAt) = EXTRACT(YEAR FROM CURRENT_DATE)',
      )
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
          thisMonth: parseFloat(revenueMonth?.total || 0),
          thisYear: parseFloat(revenueYear?.total || 0),
        },
      },
      timestamp: new Date(),
    };
  }

  async getPendingCount() {
    const pending = await this.serviceRequestRepository.count({
      where: { status: 'submitted' },
    });

    const missingDocuments = await this.serviceRequestRepository.count({
      where: { status: 'missing_documents' },
    });

    return {
      success: true,
      data: {
        pending,
        missingDocuments,
        total: pending + missingDocuments,
      },
    };
  }

  async getWorkloadDistribution() {
    // Get service requests grouped by assigned operator
    const workload = await this.serviceRequestRepository
      .createQueryBuilder('sr')
      .select('sr.assignedOperatorId', 'operatorId')
      .addSelect('COUNT(sr.id)', 'requestCount')
      .addSelect('u.fullName', 'operatorName')
      .leftJoin(User, 'u', 'u.id = sr.assignedOperatorId')
      .where('sr.status IN (:...statuses)', {
        statuses: ['submitted', 'in_review'],
      })
      .groupBy('sr.assignedOperatorId')
      .addGroupBy('u.fullName')
      .orderBy('COUNT(sr.id)', 'DESC')
      .getRawMany();

    return {
      success: true,
      data: workload.map((item) => ({
        operatorId: item.operatorId,
        operatorName: item.operatorName || 'Unassigned',
        requestCount: parseInt(item.requestCount, 10),
      })),
    };
  }
}
