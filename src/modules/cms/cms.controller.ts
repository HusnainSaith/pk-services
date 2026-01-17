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
import { CmsService } from './cms.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('CMS Content')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // Public Routes
  @Get('pages/:slug')
  @ApiOperation({ summary: '[Public] Get page by slug' })
  getPageBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Get('news')
  @ApiOperation({ summary: '[Public] List published news' })
  getPublishedNews() {
    return this.cmsService.getPublishedNews();
  }

  @Get('news/:id')
  @ApiOperation({ summary: '[Public] Get news article' })
  getNewsArticle(@Param('id') id: string) {
    return this.cmsService.getNewsArticle(id);
  }

  @Get('faqs')
  @ApiOperation({ summary: '[Public] List FAQs' })
  getFaqs() {
    return this.cmsService.getFaqs();
  }

  // Admin Routes - General Content
  @Get('content')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all content' })
  findAllContent() {
    return this.cmsService.findAllContent();
  }

  @Post('content')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create content' })
  createContent(@Body() dto: CreateContentDto) {
    return this.cmsService.createContent(dto);
  }

  @Get('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get content' })
  getContent(@Param('id') id: string) {
    return this.cmsService.getContent(id);
  }

  @Put('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateContent(id, dto);
  }

  @Delete('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete content' })
  deleteContent(@Param('id') id: string) {
    return this.cmsService.deleteContent(id);
  }

  @Patch('content/:id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Publish content' })
  publishContent(@Param('id') id: string) {
    return this.cmsService.publishContent(id);
  }

  // Pages Management
  @Post('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create new page' })
  createPage(@Body() dto: CreateContentDto) {
    return this.cmsService.createPage(dto);
  }

  @Put('pages/:slug')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update page' })
  updatePage(@Param('slug') slug: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updatePage(slug, dto);
  }

  @Delete('pages/:slug')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete page' })
  deletePage(@Param('slug') slug: string) {
    return this.cmsService.deletePage(slug);
  }

  // News Management
  @Post('news')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create news article' })
  createNews(@Body() dto: CreateContentDto) {
    return this.cmsService.createNews(dto);
  }

  @Put('news/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update news' })
  updateNews(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateNews(id, dto);
  }

  @Delete('news/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete news' })
  deleteNews(@Param('id') id: string) {
    return this.cmsService.deleteNews(id);
  }

  // FAQ Management
  @Post('faqs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create FAQ' })
  createFaq(@Body() dto: CreateContentDto) {
    return this.cmsService.createFaq(dto);
  }

  @Put('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.cmsService.deleteFaq(id);
  }
}
