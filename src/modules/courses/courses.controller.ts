import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Public Routes
  @Get()
  @ApiOperation({ summary: '[Public] List active courses' })
  findActive() {
    return this.coursesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '[Public] Get course details' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get(':id/modules')
  @ApiOperation({ summary: '[Public] Get course modules/lessons' })
  getCourseModules(@Param('id') id: string) {
    return this.coursesService.getCourseModules(id);
  }

  // Customer Routes
  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:enroll')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Enroll in course' })
  enroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.enroll(id, user.id);
  }

  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] List my enrollments' })
  getMyEnrollments(@CurrentUser() user: any) {
    return this.coursesService.getMyEnrollments(user.id);
  }

  @Delete(':id/unenroll')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:enroll')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Unenroll from course' })
  unenroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.unenroll(id, user.id);
  }

  @Get(':id/certificate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Download certificate' })
  getCertificate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.getCertificate(id, user.id);
  }

  // Extended Operations - Progress Tracking
  @Get(':id/progress')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get course progress' })
  getCourseProgress(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.getCourseProgress(id, user.id);
  }

  @Post(':id/complete-module')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:enroll')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Mark module/lesson complete' })
  completeModule(
    @Param('id') id: string,
    @Body() dto: { moduleId: string },
    @CurrentUser() user: any,
  ) {
    return this.coursesService.completeModule(id, dto.moduleId, user.id);
  }

  // Admin Routes
  @Get('all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create course' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update course' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete course' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Get(':id/enrollments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List course enrollments' })
  getCourseEnrollments(@Param('id') id: string) {
    return this.coursesService.getCourseEnrollments(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Publish course' })
  publish(@Param('id') id: string) {
    return this.coursesService.publish(id);
  }

  @Post(':id/certificate/issue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Issue certificate' })
  issueCertificate(@Param('id') id: string, @Body() dto: any) {
    return this.coursesService.issueCertificate(id, dto);
  }
}
