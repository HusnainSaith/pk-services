import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getDashboardStats() {
    return { success: true, message: 'Dashboard stats retrieved' };
  }

  async getPendingCount() {
    return { success: true, message: 'Pending count retrieved' };
  }

  async getWorkloadDistribution() {
    return { success: true, message: 'Workload distribution retrieved' };
  }
}