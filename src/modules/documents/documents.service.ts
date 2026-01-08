import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async upload(file: Express.Multer.File, dto: any, userId: string): Promise<any> {
    if (!file) {
      throw new Error('File is required');
    }
    
    const document = this.documentRepository.create({
      serviceRequestId: dto.serviceRequestId,
      category: dto.documentType || 'general',
      filename: file.originalname,
      originalFilename: file.originalname,
      filePath: `/uploads/${file.originalname}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending',
      isRequired: false,
      version: 1,
    });
    
    const saved = await this.documentRepository.save(document);
    return { success: true, message: 'Document uploaded successfully', data: saved };
  }

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

  async preview(id: string): Promise<any> {
    const document = await this.documentRepository.findOne({ where: { id } });
    return { success: true, message: 'Document preview', data: document };
  }
}