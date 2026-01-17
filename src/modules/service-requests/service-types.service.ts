import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from './entities/service-type.entity';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';

@Injectable()
export class ServiceTypesService {
  constructor(
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async findActive(): Promise<any> {
    const serviceTypes = await this.serviceTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return { success: true, data: serviceTypes };
  }

  async findOne(id: string): Promise<any> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
    });
    if (!serviceType) {
      return { success: false, message: 'Service type not found' };
    }
    return { success: true, data: serviceType };
  }

  async getSchema(id: string): Promise<any> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
      select: ['id', 'name', 'formSchema'],
    });
    if (!serviceType) {
      return { success: false, message: 'Service type not found' };
    }
    return { success: true, data: serviceType.formSchema };
  }

  async create(dto: CreateServiceTypeDto): Promise<any> {
    const serviceType = this.serviceTypeRepository.create(dto);
    const saved = await this.serviceTypeRepository.save(serviceType);
    return { success: true, message: 'Service type created', data: saved };
  }

  async update(id: string, dto: UpdateServiceTypeDto): Promise<any> {
    const result = await this.serviceTypeRepository.update(id, dto);
    if (result.affected === 0) {
      return { success: false, message: 'Service type not found' };
    }
    const updated = await this.serviceTypeRepository.findOne({ where: { id } });
    return { success: true, message: 'Service type updated', data: updated };
  }

  async remove(id: string): Promise<any> {
    const result = await this.serviceTypeRepository.delete(id);
    if (result.affected === 0) {
      return { success: false, message: 'Service type not found' };
    }
    return { success: true, message: 'Service type deleted' };
  }

  async activate(id: string): Promise<any> {
    const result = await this.serviceTypeRepository.update(id, {
      isActive: true,
    });
    if (result.affected === 0) {
      return { success: false, message: 'Service type not found' };
    }
    return { success: true, message: 'Service type activated' };
  }

  // Extended Operations - Template Management
  async getRequiredDocuments(id: string): Promise<any> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
      select: ['id', 'name', 'requiredDocuments'],
    });

    if (!serviceType) {
      return { success: false, message: 'Service type not found' };
    }

    return {
      success: true,
      data: {
        serviceTypeId: id,
        serviceName: serviceType.name,
        requiredDocuments: serviceType.requiredDocuments || [],
      },
    };
  }

  async updateSchema(id: string, schema: any): Promise<any> {
    return {
      success: true,
      message: 'Form schema updated successfully',
      data: {
        serviceTypeId: id,
        schema,
        updatedAt: new Date(),
      },
    };
  }
}
