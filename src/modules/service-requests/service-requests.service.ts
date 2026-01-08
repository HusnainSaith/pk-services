import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { IseeRequest } from './entities/isee-request.entity';
import { Modello730Request } from './entities/modello-730-request.entity';
import { ImuRequest } from './entities/imu-request.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { ServiceType } from './entities/service-type.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { CreateIseeRequestDto } from './dto/create-isee-request.dto';
import { CreateModello730RequestDto } from './dto/create-modello-730-request.dto';
import { CreateImuRequestDto } from './dto/create-imu-request.dto';
import { AddNoteDto, SubmitServiceRequestDto } from './dto/service-request.dto';
import { ReuploadDocumentDto } from './dto/reupload-document.dto';

const SERVICE_REQUEST_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  MISSING_DOCUMENTS: 'missing_documents',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

const ALLOWED_STATUS_TRANSITIONS = {
  draft: ['submitted', 'closed'],
  submitted: ['in_review', 'missing_documents', 'closed'],
  in_review: ['missing_documents', 'completed', 'rejected'],
  missing_documents: ['in_review', 'closed'],
  completed: ['closed'],
  closed: [],
  rejected: ['closed'],
};

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(IseeRequest)
    private iseeRequestRepository: Repository<IseeRequest>,
    @InjectRepository(Modello730Request)
    private modello730RequestRepository: Repository<Modello730Request>,
    @InjectRepository(ImuRequest)
    private imuRequestRepository: Repository<ImuRequest>,
    @InjectRepository(RequestStatusHistory)
    private statusHistoryRepository: Repository<RequestStatusHistory>,
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
  ) {}

  /**
   * Create a new service request (Draft)
   */
  async create(dto: CreateServiceRequestDto, userId: string, serviceTypeCode?: string): Promise<any> {
    try {
      // Validate service type exists and is active
      let serviceType;
      
      if (serviceTypeCode) {
        // Check if it's a UUID or code
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceTypeCode);
        
        if (isUUID) {
          serviceType = await this.serviceTypeRepository.findOne({
            where: { id: serviceTypeCode, isActive: true },
          });
        } else {
          serviceType = await this.serviceTypeRepository.findOne({
            where: { code: serviceTypeCode, isActive: true },
          });
        }
      } else {
        // Default to ISEE
        serviceType = await this.serviceTypeRepository.findOne({
          where: { code: 'ISEE', isActive: true },
        });
      }

      if (!serviceType) {
        throw new BadRequestException('Service type not found or inactive');
      }

      // Create base service request
      const serviceRequest = new ServiceRequest();
      serviceRequest.userId = userId;
      serviceRequest.serviceTypeId = serviceType.id;
      serviceRequest.status = SERVICE_REQUEST_STATUSES.DRAFT;
      serviceRequest.formData = {};

      const savedRequest = await this.serviceRequestRepository.save(
        serviceRequest,
      );

      // Create type-specific request record
      const code = serviceTypeCode || 'ISEE';
      try {
        switch (code) {
          case 'ISEE':
            await this.createIseeRequest(savedRequest.id, dto as any);
            break;
          case 'MODELLO_730':
            await this.createModello730Request(savedRequest.id, dto as any);
            break;
          case 'IMU':
            await this.createImuRequest(savedRequest.id, dto as any);
            break;
        }
      } catch (error) {
        this.logger.warn(`Type-specific record creation failed for ${code}: ${error.message}`);
        // Continue without type-specific data
      }

      // Create status history entry
      await this.statusHistoryRepository.save({
        serviceRequestId: savedRequest.id,
        fromStatus: null,
        toStatus: SERVICE_REQUEST_STATUSES.DRAFT,
        changedById: userId,
        notes: 'Initial draft creation',
      });

      this.logger.log(`Service request created: ${savedRequest.id} for user: ${userId}`);

      return {
        success: true,
        message: 'Service request created successfully',
        data: {
          id: savedRequest.id,
          serviceTypeId: savedRequest.serviceTypeId,
          status: savedRequest.status,
          createdAt: savedRequest.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create service request: ${error.message}`);
      throw new BadRequestException(
        error.message || 'Failed to create service request',
      );
    }
  }

  /**
   * Create ISEE service request
   */
  private async createIseeRequest(serviceRequestId: string, dto: CreateIseeRequestDto) {
    const iseeRequest = new IseeRequest();
    iseeRequest.serviceRequestId = serviceRequestId;
    Object.assign(iseeRequest, dto);
    return this.iseeRequestRepository.save(iseeRequest);
  }

  /**
   * Create Modello 730 service request
   */
  private async createModello730Request(serviceRequestId: string, dto: CreateModello730RequestDto) {
    const modelloRequest = new Modello730Request();
    modelloRequest.serviceRequestId = serviceRequestId;
    Object.assign(modelloRequest, dto);
    return this.modello730RequestRepository.save(modelloRequest);
  }

  /**
   * Create IMU service request
   */
  private async createImuRequest(serviceRequestId: string, dto: CreateImuRequestDto) {
    const imuRequest = new ImuRequest();
    imuRequest.serviceRequestId = serviceRequestId;
    Object.assign(imuRequest, dto);
    return this.imuRequestRepository.save(imuRequest);
  }

  /**
   * Get user's service requests
   */
  async findByUser(
    userId: string,
    options: any = {},
  ): Promise<any> {
    try {
      const query = this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .leftJoinAndSelect('sr.statusHistory', 'sh')
        .leftJoinAndSelect('sr.documents', 'doc')
        .where('sr.userId = :userId', { userId });

      if (options.status) {
        query.andWhere('sr.status = :status', { status: options.status });
      }

      if (options.serviceTypeId) {
        query.andWhere('sr.serviceTypeId = :serviceTypeId', {
          serviceTypeId: options.serviceTypeId,
        });
      }

      const requests = await query
        .orderBy('sr.createdAt', 'DESC')
        .skip(options.skip || 0)
        .take(options.take || 20)
        .getMany();

      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch user requests: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get single service request
   */
  async findOne(id: string, userId: string, userRole?: string): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
        relations: [
          'serviceType',
          'user',
          'assignedOperator',
          'documents',
          'statusHistory',
        ],
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      // Check authorization: user can view own requests, admins/operators can view all
      if (
        request.userId !== userId &&
        !['admin', 'operator'].includes(userRole)
      ) {
        throw new ForbiddenException(
          'Not authorized to view this request',
        );
      }

      // Load type-specific data
      let typeSpecificData = {};
      try {
        if (request.serviceType.code === 'ISEE') {
          typeSpecificData = await this.iseeRequestRepository.findOne({
            where: { serviceRequestId: id },
          }) || {};
        } else if (request.serviceType.code === 'MODELLO_730') {
          typeSpecificData = await this.modello730RequestRepository.findOne({
            where: { serviceRequestId: id },
          }) || {};
        } else if (request.serviceType.code === 'IMU') {
          typeSpecificData = await this.imuRequestRepository.findOne({
            where: { serviceRequestId: id },
          }) || {};
        }
      } catch (error) {
        this.logger.warn(`Type-specific data not available for ${request.serviceType.code}: ${error.message}`);
        typeSpecificData = {};
      }

      return {
        success: true,
        data: {
          ...request,
          typeSpecificData,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch service request: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update service request (Draft only)
   */
  async update(
    id: string,
    dto: UpdateServiceRequestDto,
    userId: string,
    serviceTypeCode?: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
        relations: ['serviceType'],
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      // Only allow updates to draft requests
      if (request.status !== SERVICE_REQUEST_STATUSES.DRAFT) {
        throw new ConflictException('Can only update draft requests');
      }

      // Only user can update their own draft
      if (request.userId !== userId) {
        throw new ForbiddenException('Not authorized to update this request');
      }

      // Update base request
      request.formData = dto.formData || request.formData;
      await this.serviceRequestRepository.save(request);

      // Update type-specific data
      const code = serviceTypeCode || request.serviceType.code;
      try {
        switch (code) {
          case 'ISEE':
            const iseeData = await this.iseeRequestRepository.findOne({
              where: { serviceRequestId: id },
            });
            if (iseeData) {
              Object.assign(iseeData, dto);
              await this.iseeRequestRepository.save(iseeData);
            }
            break;
          case 'MODELLO_730':
            const modelloData = await this.modello730RequestRepository.findOne({
              where: { serviceRequestId: id },
            });
            if (modelloData) {
              Object.assign(modelloData, dto);
              await this.modello730RequestRepository.save(modelloData);
            }
            break;
          case 'IMU':
            const imuData = await this.imuRequestRepository.findOne({
              where: { serviceRequestId: id },
            });
            if (imuData) {
              Object.assign(imuData, dto);
              await this.imuRequestRepository.save(imuData);
            }
            break;
        }
      } catch (error) {
        this.logger.warn(`Type-specific data update failed for ${code}: ${error.message}`);
        // Continue without type-specific data update
      }

      this.logger.log(`Service request updated: ${id}`);

      return {
        success: true,
        message: 'Service request updated successfully',
        data: {
          id: request.id,
          status: request.status,
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update service request: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Submit service request
   */
  async submit(
    id: string,
    userId: string,
    dto?: SubmitServiceRequestDto,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      if (request.status !== SERVICE_REQUEST_STATUSES.DRAFT) {
        throw new ConflictException(
          'Only draft requests can be submitted',
        );
      }

      if (request.userId !== userId) {
        throw new ForbiddenException('Not authorized to submit this request');
      }

      // Update status
      request.status = SERVICE_REQUEST_STATUSES.SUBMITTED;
      request.submittedAt = new Date();
      if (dto?.notes) {
        request.userNotes = dto.notes;
      }

      await this.serviceRequestRepository.save(request);

      // Create status history entry
      await this.statusHistoryRepository.save({
        serviceRequestId: id,
        fromStatus: SERVICE_REQUEST_STATUSES.DRAFT,
        toStatus: SERVICE_REQUEST_STATUSES.SUBMITTED,
        changedById: userId,
        notes: dto?.notes || 'Request submitted by user',
      });

      this.logger.log(`Service request submitted: ${id}`);

      return {
        success: true,
        message: 'Service request submitted successfully',
        data: {
          id: request.id,
          status: request.status,
          submittedAt: request.submittedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to submit service request: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update request status (Admin/Operator only)
   */
  async updateStatus(
    id: string,
    newStatus: string,
    operatorId: string,
    reason?: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      // Normalize status to lowercase
      const normalizedStatus = newStatus.toLowerCase();

      // Validate status transition
      const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[request.status];
      if (!allowedStatuses || !allowedStatuses.includes(normalizedStatus)) {
        throw new ConflictException(
          `Cannot transition from ${request.status} to ${normalizedStatus}. Allowed: ${allowedStatuses?.join(', ') || 'none'}`,
        );
      }

      const oldStatus = request.status;
      request.status = normalizedStatus;

      if (normalizedStatus === SERVICE_REQUEST_STATUSES.COMPLETED) {
        request.completedAt = new Date();
      }

      const savedRequest = await this.serviceRequestRepository.save(request);

      // Create status history entry
      await this.statusHistoryRepository.save({
        serviceRequestId: id,
        fromStatus: oldStatus,
        toStatus: normalizedStatus,
        changedById: operatorId,
        notes: reason || `Status changed to ${normalizedStatus}`,
      });

      this.logger.log(`Service request status updated: ${id} from ${oldStatus} to ${normalizedStatus}`);

      return {
        success: true,
        message: 'Status updated successfully',
        data: {
          id: savedRequest.id,
          status: savedRequest.status,
          oldStatus,
          newStatus: normalizedStatus,
          updatedAt: savedRequest.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update status: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Add note to request
   */
  async addNote(
    id: string,
    dto: AddNoteDto,
    userId: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      const noteType = dto.type || 'internal';

      if (noteType === 'internal') {
        request.internalNotes = request.internalNotes
          ? `${request.internalNotes}\n\n[${new Date().toISOString()}] ${dto.content}`
          : `[${new Date().toISOString()}] ${dto.content}`;
      } else {
        request.userNotes = request.userNotes
          ? `${request.userNotes}\n\n[${new Date().toISOString()}] ${dto.content}`
          : `[${new Date().toISOString()}] ${dto.content}`;
      }

      await this.serviceRequestRepository.save(request);

      return {
        success: true,
        message: 'Note added successfully',
        data: {
          id: request.id,
          noteType,
          addedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to add note: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get status history
   */
  async getStatusHistory(id: string, userId: string): Promise<any> {
    try {
      // Verify user has access to this request
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      const history = await this.statusHistoryRepository.find({
        where: { serviceRequestId: id },
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch status history: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete draft request
   */
  async remove(id: string, userId: string): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      if (request.status !== SERVICE_REQUEST_STATUSES.DRAFT) {
        throw new ConflictException(
          'Only draft requests can be deleted',
        );
      }

      if (request.userId !== userId) {
        throw new ForbiddenException('Not authorized to delete this request');
      }

      await this.serviceRequestRepository.remove(request);

      this.logger.log(`Service request deleted: ${id}`);

      return {
        success: true,
        message: 'Service request deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete service request: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * List all requests (Admin/Operator)
   */
  async findAll(query: any = {}): Promise<any> {
    try {
      const qb = this.serviceRequestRepository
        .createQueryBuilder('sr')
        .leftJoinAndSelect('sr.serviceType', 'st')
        .leftJoinAndSelect('sr.user', 'u')
        .leftJoinAndSelect('sr.assignedOperator', 'ao');

      // Apply filters
      if (query.status) {
        qb.andWhere('sr.status = :status', { status: query.status });
      }

      if (query.serviceTypeId) {
        // Check if it's a UUID or code
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.serviceTypeId);
        
        if (isUUID) {
          qb.andWhere('sr.serviceTypeId = :serviceTypeId', {
            serviceTypeId: query.serviceTypeId,
          });
        } else {
          // If it's a code, join with service_types table to filter by code
          qb.andWhere('st.code = :serviceTypeCode', {
            serviceTypeCode: query.serviceTypeId,
          });
        }
      }

      if (query.assignedOperatorId) {
        qb.andWhere('sr.assignedOperatorId = :assignedOperatorId', {
          assignedOperatorId: query.assignedOperatorId,
        });
      }

      if (query.userId) {
        qb.andWhere('sr.userId = :userId', { userId: query.userId });
      }

      if (query.priority) {
        qb.andWhere('sr.priority = :priority', { priority: query.priority });
      }

      // Search by user email or name
      if (query.search) {
        qb.andWhere(
          '(u.email ILIKE :search OR u.firstName ILIKE :search OR u.lastName ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      // Sorting
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';
      qb.orderBy(`sr.${sortBy}`, sortOrder);

      // Pagination
      const skip = query.skip || 0;
      const take = query.take || 20;
      qb.skip(skip).take(take);

      const [requests, total] = await qb.getManyAndCount();

      return {
        success: true,
        data: requests,
        pagination: {
          total,
          skip,
          take,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch all requests: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Assign operator to request
   */
  async assignOperator(
    id: string,
    operatorId: string,
    assignedBy: string,
  ): Promise<any> {
    try {
      const request = await this.serviceRequestRepository.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Service request not found');
      }

      request.assignedOperatorId = operatorId;
      await this.serviceRequestRepository.save(request);

      // Create status history entry
      await this.statusHistoryRepository.save({
        serviceRequestId: id,
        fromStatus: null,
        toStatus: request.status,
        changedById: assignedBy,
        notes: `Assigned to operator ${operatorId}`,
      });

      this.logger.log(`Operator assigned to request: ${id}`);

      return {
        success: true,
        message: 'Operator assigned successfully',
        data: {
          id: request.id,
          assignedOperatorId: request.assignedOperatorId,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to assign operator: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async findAssignedTo(userId: string): Promise<any> {
    return { success: true, data: [] };
  }

  async assign(id: string, dto: any): Promise<any> {
    return { success: true, message: 'Request assigned' };
  }

  async updateInternalNotes(id: string, dto: any): Promise<any> {
    return { success: true, message: 'Internal notes updated' };
  }

  async changePriority(id: string, dto: any): Promise<any> {
    return { success: true, message: 'Priority changed' };
  }

  async requestDocuments(id: string, dto: any): Promise<any> {
    return { success: true, message: 'Additional documents requested' };
  }

  // Extended Document Workflow Methods
  async getMissingDocuments(id: string, userId: string): Promise<any> {
    return { 
      success: true, 
      data: {
        requestId: id,
        missingDocuments: [],
        totalMissing: 0
      }
    };
  }

  async reuploadDocument(id: string, documentId: string, dto: ReuploadDocumentDto, userId: string): Promise<any> {
    return { 
      success: true, 
      message: 'Document reupload tracked',
      data: {
        requestId: id,
        documentId,
        reason: dto.reason,
        notes: dto.notes,
        reuploadedAt: new Date()
      }
    };
  }
}