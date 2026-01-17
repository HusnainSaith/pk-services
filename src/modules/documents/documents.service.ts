import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { ServiceType } from '../service-requests/entities/service-type.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    private storageService: StorageService,
  ) {}

  /**
   * Extract S3 key from full URL or return path as-is
   * @param urlOrPath - Full S3 URL or relative path
   * @returns S3 key (relative path)
   */
  private extractS3Key(urlOrPath: string): string {
    if (!urlOrPath) return urlOrPath;
    
    // If it's a full URL, extract the path after .amazonaws.com/bucket-name/
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const parts = urlOrPath.split('.amazonaws.com/');
      if (parts.length > 1) {
        // Further split to remove bucket name if present
        const pathAfterDomain = parts[1];
        const bucketName = this.storageService.getBucketName();
        if (pathAfterDomain.startsWith(bucketName + '/')) {
          return pathAfterDomain.substring(bucketName.length + 1);
        }
        return pathAfterDomain;
      }
    }
    
    // Already a relative path
    return urlOrPath;
  }

  // async upload(
  //   file: Express.Multer.File,
  //   dto: any,
  //   userId: string,
  // ): Promise<any> {
  //   if (!file) {
  //     throw new Error('File is required');
  //   }

  //   // Validate service request exists
  //   const serviceRequest = await this.serviceRequestRepository.findOne({
  //     where: { id: dto.serviceRequestId },
  //     relations: ['serviceType'],
  //   });

  //   if (!serviceRequest) {
  //     return { success: false, message: 'Service request not found' };
  //   }

  //   // Get service type name for S3 path
  //   const serviceTypeName = serviceRequest.serviceType?.name || 'General';
  //   const s3PathPrefix = `users/${userId}/services/${serviceTypeName.replace(/[^a-zA-Z0-9]/g, '')}`;

  //   // Upload to S3
  //   const uploadResult = await this.storageService.uploadFile(
  //     file,
  //     s3PathPrefix,
  //   );

  //   const document = this.documentRepository.create({
  //     serviceRequestId: dto.serviceRequestId,
  //     category: dto.documentType || 'general',
  //     filename: uploadResult.path.split('/').pop(),
  //     originalFilename: file.originalname,
  //     filePath: uploadResult.path,
  //     fileSize: file.size,
  //     mimeType: file.mimetype,
  //     status: 'pending',
  //     isRequired: false,
  //     version: 1,
  //   });

  //   const saved = await this.documentRepository.save(document);
  //   return {
  //     success: true,
  //     message: 'Document uploaded successfully',
  //     data: saved,
  //   };
  // }

  async findByRequest(requestId: string, userId: string): Promise<any> {
    const documents = await this.documentRepository.find({
      where: { serviceRequestId: requestId },
    });
    return { success: true, data: documents };
  }

  async findOne(id: string): Promise<any> {
    const document = await this.documentRepository.findOne({ where: { id } });
    return { success: true, data: document };
  }

  async download(id: string, userId: string): Promise<any> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });
    return { success: true, message: 'Document downloaded', data: document };
  }

  async replaceMultiple(
    id: string,
    files: { [key: string]: Express.Multer.File[] },
    dto: any,
    userId: string,
  ): Promise<any> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      return { success: false, message: 'Document not found' };
    }

    // Get service request for S3 path
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: document.serviceRequestId },
      relations: ['serviceType'],
    });

    if (files && Object.keys(files).length > 0) {
      const serviceTypeName = serviceRequest?.serviceType?.name || 'General';
      const s3PathPrefix = `users/${userId}/services/${serviceTypeName.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Get first available file
      const fileArray = Object.values(files)[0];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];

        // Delete old file from S3
        if (document.filePath) {
          const s3Key = this.extractS3Key(document.filePath);
          await this.storageService.deleteFile(s3Key);
        }

        // Upload new file to S3
        const uploadResult = await this.storageService.uploadFile(
          file,
          s3PathPrefix,
        );

        await this.documentRepository.update(id, {
          filename: uploadResult.path.split('/').pop(),
          originalFilename: file.originalname,
          filePath: uploadResult.publicUrl, // Use full S3 URL instead of relative path
          fileSize: file.size,
          mimeType: file.mimetype,
          updatedAt: new Date(),
        });
      }
    }

    const updated = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document replaced', data: updated };
  }

  async replace(id: string, file: Express.Multer.File): Promise<any> {
    await this.documentRepository.update(id, {
      filename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      updatedAt: new Date(),
    });
    const updated = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document replaced', data: updated };
  }

  async remove(id: string): Promise<any> {
    await this.documentRepository.delete(id);
    return { success: true, message: 'Document deleted' };
  }

  async findAllByRequest(requestId: string): Promise<any> {
    const documents = await this.documentRepository.find({
      where: { serviceRequestId: requestId },
    });
    return { success: true, data: documents };
  }

  async approve(id: string, dto: any): Promise<any> {
    await this.documentRepository.update(id, {
      status: 'approved',
      adminNotes: dto.notes,
    });
    const updated = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document approved', data: updated };
  }

  async reject(id: string, dto: any): Promise<any> {
    await this.documentRepository.update(id, {
      status: 'rejected',
      adminNotes: dto.reason,
    });
    const updated = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document rejected', data: updated };
  }

  async addNotes(id: string, dto: any): Promise<any> {
    await this.documentRepository.update(id, {
      adminNotes: dto.notes,
    });
    const updated = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Admin notes added', data: updated };
  }

  async getRequiredDocuments(serviceTypeId: string): Promise<any> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id: serviceTypeId },
      select: ['id', 'name', 'requiredDocuments'],
    });

    if (!serviceType) {
      return { success: false, message: 'Service type not found' };
    }

    return {
      success: true,
      data: {
        serviceTypeId,
        serviceName: serviceType.name,
        requiredDocuments: serviceType.requiredDocuments || [],
      },
    };
  }

  async uploadMultiple(
    files: { [key: string]: Express.Multer.File[] },
    dto: any,
    userId: string,
  ): Promise<any> {
    if (!files || Object.keys(files).length === 0) {
      return { success: false, message: 'No files provided' };
    }

    // Validate service request exists
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: dto.serviceRequestId },
      relations: ['serviceType'],
    });

    if (!serviceRequest) {
      return { success: false, message: 'Service request not found' };
    }

    const documents = [];
    const documentTypeMapping = {
      identityDocument: 'IDENTITY',
      fiscalCode: 'TAX_CODE',
      incomeCertificate: 'INCOME',
      bankStatement: 'ASSETS',
      propertyDocument: 'PROPERTY',
      visuraCatastale: 'PROPERTY',
      propertyDeed: 'DEED',
      cuCertificate: 'INCOME',
      medicalReceipts: 'EXPENSES',
      expenseReceipts: 'EXPENSES',
      otherDocument: 'OTHER',
    };

    // Get service type name for S3 path
    const serviceTypeName = serviceRequest.serviceType?.name || 'General';
    const s3PathPrefix = `users/${userId}/services/${serviceTypeName.replace(/[^a-zA-Z0-9]/g, '')}`;

    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];

        // Upload to S3
        const uploadResult = await this.storageService.uploadFile(
          file,
          s3PathPrefix,
        );

        const document = this.documentRepository.create({
          serviceRequestId: dto.serviceRequestId,
          category: documentTypeMapping[fieldName] || 'OTHER',
          filename: uploadResult.path.split('/').pop(),
          originalFilename: file.originalname,
          filePath: uploadResult.publicUrl, // Use full S3 URL instead of relative path
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'pending',
          isRequired: true,
          version: 1,
        });
        documents.push(document);
      }
    }

    if (documents.length === 0) {
      return { success: false, message: 'No valid files to upload' };
    }

    const saved = await this.documentRepository.save(documents);
    return {
      success: true,
      message: `${documents.length} documents uploaded successfully`,
      data: saved,
    };
  }

  async preview(id: string): Promise<any> {
    const document = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document preview', data: document };
  }
}
