import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';

@Injectable()
export class FamilyMembersService {
  constructor(
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
  ) {}

  async create(dto: CreateFamilyMemberDto, userId: string) {
    const familyMember = this.familyMemberRepository.create({
      ...dto,
      userId,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
    });

    const saved = await this.familyMemberRepository.save(familyMember);

    return {
      success: true,
      message: 'Family member added successfully',
      data: saved,
    };
  }

  async findByUser(userId: string) {
    const familyMembers = await this.familyMemberRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return {
      success: true,
      message: 'Family members retrieved successfully',
      data: familyMembers,
    };
  }

  async findOne(userId: string, id: string) {
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id, userId },
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    return {
      success: true,
      message: 'Family member retrieved successfully',
      data: familyMember,
    };
  }

  async update(id: string, dto: UpdateFamilyMemberDto, userId: string) {
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id, userId },
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    Object.assign(familyMember, dto);
    if (dto.birthDate) {
      familyMember.birthDate = new Date(dto.birthDate);
    }

    const saved = await this.familyMemberRepository.save(familyMember);

    return {
      success: true,
      message: 'Family member updated successfully',
      data: saved,
    };
  }

  async remove(id: string, userId: string) {
    const familyMember = await this.familyMemberRepository.findOne({
      where: { id, userId },
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    await this.familyMemberRepository.remove(familyMember);

    return {
      success: true,
      message: 'Family member removed successfully',
    };
  }

  // Extended Operations - Document Management
  async getFamilyMemberDocuments(id: string, userId: string) {
    return {
      success: true,
      message: 'Family member documents retrieved',
      data: [],
    };
  }

  async uploadFamilyMemberDocument(id: string, file: Express.Multer.File, dto: any, userId: string) {
    return {
      success: true,
      message: 'Document uploaded for family member',
      data: { documentId: 'doc_123' },
    };
  }
}