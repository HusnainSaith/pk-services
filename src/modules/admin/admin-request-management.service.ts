import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { User } from '../users/entities/user.entity';
import { Document } from '../documents/entities/document.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminRequestManagementService {
  private readonly logger = new Logger(AdminRequestManagementService.name);

  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get all service requests with comprehensive filtering
   * Supports filtering by status, service type, assigned operator, priority, and search
   */
  async getAllRequests(filters: {
    status?: string;
    serviceTypeId?: string;
    assignedOperatorId?: string;
    userId?: string;
    priority?: string;
    search?: string;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<any> {
    try {
      const skip = filters.skip || 0;
      const take = filters.take || 20;
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';

      const query = this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .leftJoinAndSelect('sr.user', 'u')
        .leftJoinAndSelect('sr.assignedOperator', 'op')
        .skip(skip)
        .take(take)
        .orderBy(`sr.${sortBy}`, sortOrder);

      // Apply filters
      if (filters.status) {
        const statuses = filters.status.split(',');
        query.andWhere('sr.status IN (:statuses)', { statuses });
      }

      if (filters.serviceTypeId) {
        query.andWhere('sr.serviceTypeId = :serviceTypeId', {
          serviceTypeId: filters.serviceTypeId,
        });
      }

      if (filters.assignedOperatorId) {
        query.andWhere('sr.assignedOperatorId = :operatorId', {
          operatorId: filters.assignedOperatorId,
        });
      }

      if (filters.userId) {
        query.andWhere('sr.userId = :userId', { userId: filters.userId });
      }

      if (filters.priority) {
        query.andWhere('sr.priority = :priority', {
          priority: filters.priority,
        });
      }

      if (filters.search) {
        query.andWhere(
          '(u.email ILIKE :search OR u.fullName ILIKE :search OR sr.id ILIKE :search)',
          {
            search: `%${filters.search}%`,
          },
        );
      }

      const [data, total] = await query.getManyAndCount();

      return {
        success: true,
        data,
        pagination: {
          skip,
          take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed request information including documents and history
   */
  async getRequestDetail(id: string): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
        relations: [
          'serviceType',
          'user',
          'assignedOperator',
          'documents',
          'statusHistory',
          'notes',
        ],
      });

      if (!request) {
        throw new NotFoundException(`Service request not found: ${id}`);
      }

      // Get document statistics
      const documents = await this.documentRepository.find({
        where: { serviceRequestId: id },
      });

      const docStats = {
        total: documents.length,
        approved: documents.filter((d) => d.status === 'approved').length,
        rejected: documents.filter((d) => d.status === 'rejected').length,
        pending: documents.filter((d) => d.status === 'pending').length,
      };

      return {
        success: true,
        data: {
          ...request,
          documentStats: docStats,
          documents,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch request detail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get requests assigned to specific operator
   */
  async getOperatorRequests(operatorId: string, filters?: any): Promise<any> {
    try {
      const query = this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .leftJoinAndSelect('sr.user', 'u')
        .where('sr.assignedOperatorId = :operatorId', { operatorId });

      if (filters?.status) {
        const statuses = filters.status.split(',');
        query.andWhere('sr.status IN (:statuses)', { statuses });
      }

      if (filters?.priority) {
        query.andWhere('sr.priority = :priority', {
          priority: filters.priority,
        });
      }

      const skip = filters?.skip || 0;
      const take = filters?.take || 20;

      query.skip(skip).take(take).orderBy('sr.createdAt', 'DESC');

      const [data, total] = await query.getManyAndCount();

      return {
        success: true,
        data,
        pagination: {
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch operator requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign request to operator
   */
  async assignToOperator(
    requestId: string,
    operatorId: string,
    adminId: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id: requestId },
        relations: ['user'],
      });

      if (!request) {
        throw new NotFoundException(`Service request not found: ${requestId}`);
      }

      const operator = await this.userRepository.findOne({
        where: { id: operatorId },
      });

      if (!operator) {
        throw new NotFoundException(`Operator not found: ${operatorId}`);
      }

      // Update assignment
      request.assignedOperatorId = operatorId;
      await this.serviceRequestRepository.save(request);

      // Send notification to operator
      await this.notificationsService.send({
        userId: operatorId,
        type: 'REQUEST_ASSIGNED',
        title: 'New Request Assigned',
        message: `Service request ${request.id} has been assigned to you`,
        data: { requestId },
      });

      // Log in audit
      this.logger.log(
        `Request ${requestId} assigned to operator ${operatorId} by admin ${adminId}`,
      );

      return {
        success: true,
        message: 'Request assigned successfully',
        data: request,
      };
    } catch (error) {
      this.logger.error(`Failed to assign request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update request status with validation
   */
  async updateRequestStatus(
    requestId: string,
    newStatus: string,
    adminId: string,
    reason?: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id: requestId },
        relations: ['user', 'statusHistory'],
      });

      if (!request) {
        throw new NotFoundException(`Service request not found: ${requestId}`);
      }

      // Validate status transition
      const validTransitions = {
        draft: ['submitted', 'closed'],
        submitted: ['in_review', 'missing_documents', 'closed'],
        in_review: ['missing_documents', 'completed', 'rejected'],
        missing_documents: ['in_review', 'closed'],
        completed: ['closed'],
        rejected: ['closed'],
        closed: [],
      };

      if (
        !validTransitions[request.status] ||
        !validTransitions[request.status].includes(newStatus)
      ) {
        throw new BadRequestException(
          `Cannot transition from ${request.status} to ${newStatus}`,
        );
      }

      const oldStatus = request.status;
      request.status = newStatus;

      await this.serviceRequestRepository.save(request);

      // Notify user if status changes
      if (newStatus === 'completed') {
        await this.notificationsService.send({
          userId: request.userId,
          type: 'REQUEST_COMPLETED',
          title: 'Request Completed',
          message: 'Your service request has been completed successfully',
          data: { requestId },
        });
      } else if (newStatus === 'rejected') {
        await this.notificationsService.send({
          userId: request.userId,
          type: 'REQUEST_REJECTED',
          title: 'Request Rejected',
          message: reason || 'Your service request has been rejected',
          data: { requestId },
        });
      } else if (newStatus === 'missing_documents') {
        await this.notificationsService.send({
          userId: request.userId,
          type: 'DOCUMENTS_NEEDED',
          title: 'Additional Documents Required',
          message: 'We need additional documents to process your request',
          data: { requestId },
        });
      }

      this.logger.log(
        `Request ${requestId} status updated from ${oldStatus} to ${newStatus} by admin ${adminId}`,
      );

      return {
        success: true,
        message: `Status updated to ${newStatus}`,
        data: request,
      };
    } catch (error) {
      this.logger.error(`Failed to update request status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add internal note to request
   */
  async addInternalNote(
    requestId: string,
    note: string,
    adminId: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException(`Service request not found: ${requestId}`);
      }

      // Append note to existing internalNotes field
      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] Admin ${adminId}: ${note}`;

      if (request.internalNotes) {
        request.internalNotes = `${request.internalNotes}\n${newNote}`;
      } else {
        request.internalNotes = newNote;
      }

      await this.serviceRequestRepository.save(request);

      this.logger.log(
        `Internal note added to request ${requestId} by admin ${adminId}`,
      );

      return {
        success: true,
        message: 'Note added successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to add note: ${error.message}`);
      throw error;
    }
  }

  /**
   * Request additional documents from user
   */
  async requestAdditionalDocuments(
    requestId: string,
    documentCategories: string[],
    reason: string,
    adminId: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id: requestId },
        relations: ['user'],
      });

      if (!request) {
        throw new NotFoundException(`Service request not found: ${requestId}`);
      }

      // Update request status if not already in missing_documents
      if (request.status !== 'missing_documents') {
        request.status = 'missing_documents';
        await this.serviceRequestRepository.save(request);
      }

      // Send notification to user
      await this.notificationsService.send({
        userId: request.userId,
        type: 'DOCUMENTS_NEEDED',
        title: 'Additional Documents Required',
        message: `Please provide: ${documentCategories.join(', ')}. Reason: ${reason}`,
        data: {
          requestId,
          categories: documentCategories,
        },
      });

      this.logger.log(
        `Document request sent for request ${requestId} by admin ${adminId}`,
      );

      return {
        success: true,
        message: 'Document request sent to user',
        data: {
          categories: documentCategories,
          sentAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to request documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get request statistics for dashboard
   */
  async getRequestStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    try {
      const startDate =
        filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters?.endDate || new Date();

      const [total, completed, pending, rejected] = await Promise.all([
        this.serviceRequestRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        }),
        this.serviceRequestRepository.count({
          where: {
            status: 'completed',
            createdAt: Between(startDate, endDate),
          },
        }),
        this.serviceRequestRepository.count({
          where: {
            status: In(['submitted', 'in_review', 'missing_documents']),
            createdAt: Between(startDate, endDate),
          },
        }),
        this.serviceRequestRepository.count({
          where: {
            status: 'rejected',
            createdAt: Between(startDate, endDate),
          },
        }),
      ]);

      const completionRate =
        total > 0 ? ((completed / total) * 100).toFixed(2) : '0';

      // Get by service type
      const byServiceType = await this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoin('sr.serviceType', 'st')
        .select('st.code', 'code')
        .addSelect('COUNT(*)', 'count')
        .where('sr.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('st.code')
        .getRawMany();

      // Get by priority
      const byPriority = await this.serviceRequestRepository
        .createQueryBuilder('sr')
        .select('sr.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .where('sr.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('sr.priority')
        .getRawMany();

      return {
        success: true,
        data: {
          period: { startDate, endDate },
          summary: {
            total,
            completed,
            pending,
            rejected,
            completionRate: `${completionRate}%`,
          },
          byServiceType,
          byPriority,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bulk update request status
   */
  async bulkUpdateStatus(
    requestIds: string[],
    newStatus: string,
    adminId: string,
  ): Promise<any> {
    try {
      const requests = await this.serviceRequestRepository.find({
        where: { id: In(requestIds) },
      });

      if (requests.length === 0) {
        throw new NotFoundException('No requests found');
      }

      const updated = [];
      const failed = [];

      for (const request of requests) {
        try {
          await this.updateRequestStatus(request.id, newStatus, adminId);
          updated.push(request.id);
        } catch (error) {
          failed.push({
            id: request.id,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        message: `${updated.length} requests updated, ${failed.length} failed`,
        data: {
          updated,
          failed,
        },
      };
    } catch (error) {
      this.logger.error(`Failed bulk update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export requests to CSV/PDF
   */
  async exportRequests(format: 'csv' | 'pdf', filters?: any): Promise<any> {
    try {
      const result = await this.getAllRequests(filters);

      // For now, return the data structure that can be exported
      // In a real implementation, you'd generate actual CSV/PDF files
      return {
        success: true,
        format,
        recordCount: result.data.length,
        data: result.data,
      };
    } catch (error) {
      this.logger.error(`Failed to export: ${error.message}`);
      throw error;
    }
  }
}
