import { BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

/**
 * CoursesService
 * Manages course creation, enrollment, and learning pathways
 * Extends BaseService for core CRUD operations
 */
export class CoursesService extends BaseService<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  protected readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    protected readonly courseRepository: Repository<Course>,
  ) {
    super(courseRepository);
  }

  /**
   * Find published/active courses
   */
  async findActive(options?: any): Promise<any> {
    const { skip = 0, take = 20 } = options || {};
    this.logger.debug('Fetching active courses');
    const [data, total] = await this.courseRepository.findAndCount({
      where: { status: 'published' },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return { data, total, skip, take };
  }

  /**
   * Find all courses (wrapper for BaseService)
   */
  async findAll(options?: any): Promise<any> {
    const { skip = 0, take = 20 } = options || {};
    return super.findAll({
      pagination: { skip, take }
    });
  }

  /**
   * Find single course (wrapper for BaseService)
   */
  async findOne(id: string): Promise<any> {
    return super.findById(id);
  }

  /**
   * Remove course (wrapper for BaseService)
   */
  async remove(id: string): Promise<any> {
    return super.delete(id);
  }

  /**
   * Enroll user in course
   */
  async enroll(id: string, userId: string): Promise<any> {
    this.logger.debug(`User ${userId} enrolling in course ${id}`);
    const course = await this.findById(id);

    if (course.status !== 'published') {
      throw new BadRequestException('Course not available');
    }

    return {
      courseId: id,
      userId,
      enrolledAt: new Date(),
      progress: 0,
    };
  }

  /**
   * Get user's course enrollments
   */
  async findEnrollmentsByUser(userId: string, options?: any): Promise<any> {
    const { skip = 0, take = 20 } = options || {};
    this.logger.debug(`Fetching enrollments for user ${userId}`);
    // TODO: Implement enrollment tracking when enrollment entity is ready
    return { data: [], total: 0, skip, take };
  }

  /**
   * Unenroll user from course
   */
  async unenroll(id: string, userId: string): Promise<any> {
    this.logger.log(`User ${userId} unenrolling from course ${id}`);
    await this.findById(id);
    // TODO: Implement enrollment removal
    return { courseId: id, userId };
  }

  /**
   * Get certificate for course completion
   */
  async getCertificate(id: string, userId: string): Promise<any> {
    this.logger.debug(
      `Fetching certificate for user ${userId} in course ${id}`,
    );
    await this.findById(id);
    // TODO: Implement certificate retrieval
    return {
      certificateId: 'cert_' + Date.now(),
      courseId: id,
      userId,
      issuedAt: new Date(),
    };
  }

  /**
   * Create course with default draft status
   */
  async create(dto: CreateCourseDto): Promise<any> {
    this.logger.debug(`Creating new course: ${dto.title}`);
    const courseDto: any = { ...dto, status: dto.status || 'draft' };
    const saved = await super.create(courseDto);
    this.logger.log(`Course ${saved.id} created`);
    return saved;
  }

  /**
   * Publish course
   */
  async publish(id: string): Promise<any> {
    this.logger.log(`Publishing course ${id}`);
    const course = await this.findById(id);
    course.status = 'published';
    const updated = await this.courseRepository.save(course);
    return updated;
  }

  /**
   * Get course enrollments (admin)
   */
  async getEnrollments(id: string, options?: any): Promise<any> {
    const { skip = 0, take = 20 } = options || {};
    this.logger.debug(`Fetching enrollments for course ${id}`);
    await this.findById(id);
    // TODO: Implement enrollment listing
    return { data: [], total: 0, skip, take };
  }

  /**
   * Issue certificate to user
   */
  async issueCertificate(id: string, userId?: string): Promise<any> {
    this.logger.log(`Issuing certificate for course ${id}`);
    await this.findById(id);
    // TODO: Implement certificate issuance
    return {
      certificateId: 'cert_' + Date.now(),
      courseId: id,
      userId,
      issuedAt: new Date(),
    };
  }

  /**
   * Get user's enrollments (alias)
   */
  async getMyEnrollments(userId: string): Promise<any> {
    return this.findEnrollmentsByUser(userId);
  }

  /**
   * Get course modules (stub - implement when module entity ready)
   */
  async getCourseModules(id: string): Promise<any> {
    this.logger.debug(`Fetching modules for course ${id}`);
    await this.findById(id);
    // TODO: Implement when CourseModule entity is ready
    return {
      courseId: id,
      modules: [],
    };
  }

  /**
   * Get user progress in course (stub - implement when progress tracking ready)
   */
  async getCourseProgress(id: string, userId: string): Promise<any> {
    this.logger.debug(`Fetching progress for user ${userId} in course ${id}`);
    await this.findById(id);
    // TODO: Implement when UserCourseProgress entity is ready
    return {
      courseId: id,
      userId,
      completedModules: 0,
      totalModules: 0,
      progressPercentage: 0,
      completedLessons: [],
    };
  }

  /**
   * Mark module as complete (stub - implement when tracking ready)
   */
  async completeModule(
    courseId: string,
    moduleId: string,
    userId: string,
  ): Promise<any> {
    this.logger.log(`Marking module ${moduleId} complete for user ${userId}`);
    await this.findById(courseId);
    // TODO: Implement when completion tracking is ready
    return {
      courseId,
      moduleId,
      userId,
      completedAt: new Date(),
    };
  }

  /**
   * Get course enrollments (alias)
   */
  async getCourseEnrollments(id: string): Promise<any> {
    return this.getEnrollments(id);
  }
}
