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
  @ApiOperation({ summary: 'Get page by slug' })
  getPageBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Get('news')
  @ApiOperation({ summary: 'List published news' })
  getPublishedNews() {
    return this.cmsService.getPublishedNews();
  }

  @Get('news/:id')
  @ApiOperation({ summary: 'Get news article' })
  getNewsArticle(@Param('id') id: string) {
    return this.cmsService.getNewsArticle(id);
  }

  @Get('faqs')
  @ApiOperation({ summary: 'List FAQs' })
  getFaqs() {
    return this.cmsService.getFaqs();
  }

  // Admin Routes - General Content
  @Get('content')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all content' })
  findAllContent() {
    return this.cmsService.findAllContent();
  }

  @Post('content')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create content' })
  createContent(@Body() dto: CreateContentDto) {
    return this.cmsService.createContent(dto);
  }

  @Get('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get content' })
  getContent(@Param('id') id: string) {
    return this.cmsService.getContent(id);
  }

  @Put('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update content' })
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateContent(id, dto);
  }

  @Delete('content/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete content' })
  deleteContent(@Param('id') id: string) {
    return this.cmsService.deleteContent(id);
  }

  @Patch('content/:id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish content' })
  publishContent(@Param('id') id: string) {
    return this.cmsService.publishContent(id);
  }

  // Pages Management
  @Post('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new page' })
  createPage(@Body() dto: CreateContentDto) {
    return this.cmsService.createPage(dto);
  }

  @Put('pages/:slug')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update page' })
  updatePage(@Param('slug') slug: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updatePage(slug, dto);
  }

  @Delete('pages/:slug')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete page' })
  deletePage(@Param('slug') slug: string) {
    return this.cmsService.deletePage(slug);
  }

  // News Management
  @Post('news')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create news article' })
  createNews(@Body() dto: CreateContentDto) {
    return this.cmsService.createNews(dto);
  }

  @Put('news/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update news' })
  updateNews(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateNews(id, dto);
  }

  @Delete('news/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete news' })
  deleteNews(@Param('id') id: string) {
    return this.cmsService.deleteNews(id);
  }

  // FAQ Management
  @Post('faqs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create FAQ' })
  createFaq(@Body() dto: CreateContentDto) {
    return this.cmsService.createFaq(dto);
  }

  @Put('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.cmsService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cms:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.cmsService.deleteFaq(id);
  }
}