import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsContent } from './entities/cms-content.entity';
import { CreateCmsContentDto } from './dto/create-cms-content.dto';
import { UpdateCmsContentDto } from './dto/update-cms-content.dto';
import { ValidationUtil } from '../../common/utils/validation.util';

/**
 * CmsService
 * Implements full CMS functionality with real database operations
 * Supports Pages, FAQs, and News Articles (MILSTON M7)
 */
@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    @InjectRepository(CmsContent)
    private cmsRepository: Repository<CmsContent>,
  ) {}

  // ============================================================================
  // CONTENT CRUD OPERATIONS
  // ============================================================================

  /**
   * Create new content (page, FAQ, news, etc.)
   */
  async create(dto: CreateCmsContentDto): Promise<any> {
    try {
      ValidationUtil.validateRequired(dto.title, 'title');
      ValidationUtil.validateRequired(dto.type, 'type');

      // Generate slug from title if not provided
      const slug = dto.slug || this.generateSlug(dto.title);

      // Check if slug already exists
      const existing = await this.cmsRepository.findOne({
        where: { slug },
      });

      if (existing) {
        throw new BadRequestException(`Content with slug "${slug}" already exists`);
      }

      const content = this.cmsRepository.create({
        ...dto,
        slug,
        status: 'draft',
        views: 0,
        createdAt: new Date(),
      });

      const saved = await this.cmsRepository.save(content);

      this.logger.log(`Content created: ${saved.id} (${dto.type})`);

      return {
        success: true,
        message: 'Content created successfully',
        data: saved,
      };
    } catch (error) {
      this.logger.error(`Failed to create content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all content with pagination and filtering
   */
  async findAll(options?: { type?: string; status?: string; skip?: number; take?: number }): Promise<any> {
    try {
      const skip = options?.skip || 0;
      const take = options?.take || 20;
      const where: any = {};

      if (options?.type) {
        where.type = options.type;
      }
      if (options?.status) {
        where.status = options.status;
      }

      const [data, total] = await this.cmsRepository.findAndCount({
        where,
        skip,
        take,
        order: { createdAt: 'DESC' },
      });

      return ValidationUtil.createPaginatedResponse(
        'Content retrieved successfully',
        data,
        total,
        Math.floor(skip / take) + 1,
        take,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single content by ID
   */
  async findOne(id: string): Promise<any> {
    try {
      ValidationUtil.validateUUID(id);

      const content = await this.cmsRepository.findOne({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get content by slug
   */
  async findBySlug(slug: string): Promise<any> {
    try {
      ValidationUtil.validateRequired(slug, 'slug');

      const content = await this.cmsRepository.findOne({
        where: { slug, status: 'published' },
      });

      if (!content) {
        throw new NotFoundException(`Content with slug "${slug}" not found`);
      }

      // Increment views
      content.views = (content.views || 0) + 1;
      await this.cmsRepository.save(content);

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch content by slug: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update content
   */
  async update(id: string, dto: UpdateCmsContentDto): Promise<any> {
    try {
      ValidationUtil.validateUUID(id);

      const content = await this.cmsRepository.findOne({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      // Check slug uniqueness if updating slug
      if (dto.slug && dto.slug !== content.slug) {
        const existing = await this.cmsRepository.findOne({
          where: { slug: dto.slug },
        });
        if (existing) {
          throw new BadRequestException(`Content with slug "${dto.slug}" already exists`);
        }
      }

      Object.assign(content, dto, {
        updatedAt: new Date(),
      });

      const saved = await this.cmsRepository.save(content);

      this.logger.log(`Content updated: ${id}`);

      return {
        success: true,
        message: 'Content updated successfully',
        data: saved,
      };
    } catch (error) {
      this.logger.error(`Failed to update content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete content
   */
  async remove(id: string): Promise<any> {
    try {
      ValidationUtil.validateUUID(id);

      const content = await this.cmsRepository.findOne({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      await this.cmsRepository.remove(content);

      this.logger.log(`Content deleted: ${id}`);

      return {
        success: true,
        message: 'Content deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish content
   */
  async publish(id: string): Promise<any> {
    try {
      ValidationUtil.validateUUID(id);

      const content = await this.cmsRepository.findOne({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      content.status = 'published';
      content.publishedAt = new Date();

      const saved = await this.cmsRepository.save(content);

      this.logger.log(`Content published: ${id}`);

      return {
        success: true,
        message: 'Content published successfully',
        data: saved,
      };
    } catch (error) {
      this.logger.error(`Failed to publish content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unpublish content
   */
  async unpublish(id: string): Promise<any> {
    try {
      ValidationUtil.validateUUID(id);

      const content = await this.cmsRepository.findOne({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      content.status = 'draft';

      const saved = await this.cmsRepository.save(content);

      this.logger.log(`Content unpublished: ${id}`);

      return {
        success: true,
        message: 'Content unpublished successfully',
        data: saved,
      };
    } catch (error) {
      this.logger.error(`Failed to unpublish content: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // PAGES
  // ============================================================================

  /**
   * Get published pages
   */
  async findPublishedPages(options?: { skip?: number; take?: number }): Promise<any> {
    const skip = options?.skip || 0;
    const take = options?.take || 20;

    const [data, total] = await this.cmsRepository.findAndCount({
      where: { type: 'page', status: 'published' },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return ValidationUtil.createPaginatedResponse(
      'Pages retrieved successfully',
      data,
      total,
      Math.floor(skip / take) + 1,
      take,
    );
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug: string): Promise<any> {
    return this.findBySlug(slug);
  }

  /**
   * Create page
   */
  async createPage(dto: CreateCmsContentDto): Promise<any> {
    return this.create({ ...dto, type: 'page' });
  }

  /**
   * Update page
   */
  async updatePage(id: string, dto: UpdateCmsContentDto): Promise<any> {
    return this.update(id, dto);
  }

  /**
   * Delete page
   */
  async deletePage(id: string): Promise<any> {
    return this.remove(id);
  }

  // ============================================================================
  // NEWS & ARTICLES
  // ============================================================================

  /**
   * Get published news
   */
  async findPublishedNews(options?: { skip?: number; take?: number }): Promise<any> {
    const skip = options?.skip || 0;
    const take = options?.take || 20;

    const [data, total] = await this.cmsRepository.findAndCount({
      where: { type: 'news', status: 'published' },
      skip,
      take,
      order: { publishedAt: 'DESC' },
    });

    return ValidationUtil.createPaginatedResponse(
      'News retrieved successfully',
      data,
      total,
      Math.floor(skip / take) + 1,
      take,
    );
  }

  /**
   * Get news by ID
   */
  async findNewsById(id: string): Promise<any> {
    return this.findOne(id);
  }

  /**
   * Create news article
   */
  async createNews(dto: CreateCmsContentDto): Promise<any> {
    return this.create({ ...dto, type: 'news' });
  }

  /**
   * Update news article
   */
  async updateNews(id: string, dto: UpdateCmsContentDto): Promise<any> {
    return this.update(id, dto);
  }

  /**
   * Delete news article
   */
  async deleteNews(id: string): Promise<any> {
    return this.remove(id);
  }

  /**
   * Get published news (alias)
   */
  async getPublishedNews(): Promise<any> {
    return this.findPublishedNews();
  }

  /**
   * Get news article (alias)
   */
  async getNewsArticle(id: string): Promise<any> {
    return this.findNewsById(id);
  }

  // ============================================================================
  // FAQs
  // ============================================================================

  /**
   * Get FAQs
   */
  async findFaqs(options?: { skip?: number; take?: number; category?: string }): Promise<any> {
    const skip = options?.skip || 0;
    const take = options?.take || 20;
    const where: any = { type: 'faq', status: 'published' };

    if (options?.category) {
      where.category = options.category;
    }

    const [data, total] = await this.cmsRepository.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'ASC' },
    });

    return ValidationUtil.createPaginatedResponse(
      'FAQs retrieved successfully',
      data,
      total,
      Math.floor(skip / take) + 1,
      take,
    );
  }

  /**
   * Create FAQ
   */
  async createFaq(dto: CreateCmsContentDto): Promise<any> {
    return this.create({ ...dto, type: 'faq' });
  }

  /**
   * Update FAQ
   */
  async updateFaq(id: string, dto: UpdateCmsContentDto): Promise<any> {
    return this.update(id, dto);
  }

  /**
   * Delete FAQ
   */
  async deleteFaq(id: string): Promise<any> {
    return this.remove(id);
  }

  /**
   * Get FAQs (alias)
   */
  async getFaqs(): Promise<any> {
    return this.findFaqs();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Search content
   */
  async search(query: string, type?: string): Promise<any> {
    try {
      ValidationUtil.validateRequired(query, 'query');

      const where: any = {
        status: 'published',
      };

      if (type) {
        where.type = type;
      }

      const data = await this.cmsRepository
        .createQueryBuilder('cms')
        .where(where)
        .andWhere('(cms.title ILIKE :query OR cms.content ILIKE :query)', {
          query: `%${query}%`,
        })
        .orderBy('cms.createdAt', 'DESC')
        .limit(50)
        .getMany();

      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get content statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [totalContent, publishedContent, draftContent, totalViews] = await Promise.all([
        this.cmsRepository.count(),
        this.cmsRepository.count({ where: { status: 'published' } }),
        this.cmsRepository.count({ where: { status: 'draft' } }),
        this.cmsRepository
          .createQueryBuilder('cms')
          .select('SUM(cms.views)', 'total')
          .getRawOne(),
      ]);

      const contentByType = await this.cmsRepository
        .createQueryBuilder('cms')
        .select('cms.type', 'type')
        .addSelect('COUNT(cms.id)', 'count')
        .groupBy('cms.type')
        .getRawMany();

      return {
        success: true,
        data: {
          totalContent,
          publishedContent,
          draftContent,
          totalViews: parseInt(totalViews?.total || 0),
          contentByType: contentByType.reduce((acc, item) => {
            acc[item.type] = parseInt(item.count);
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // ALIASES FOR BACKWARD COMPATIBILITY
  // ============================================================================

  async findAllContent(): Promise<any> {
    return this.findAll();
  }

  async createContent(dto: CreateCmsContentDto): Promise<any> {
    return this.create(dto);
  }

  async getContent(id: string): Promise<any> {
    return this.findOne(id);
  }

  async updateContent(id: string, dto: UpdateCmsContentDto): Promise<any> {
    return this.update(id, dto);
  }

  async deleteContent(id: string): Promise<any> {
    return this.remove(id);
  }

  async publishContent(id: string): Promise<any> {
    return this.publish(id);
  }
}