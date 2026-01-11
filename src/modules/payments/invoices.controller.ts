import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * Get user's invoices with pagination
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getUserInvoices(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page as unknown as string) : 1;
    const limitNum = limit ? parseInt(limit as unknown as string) : 10;
    const invoices = await this.invoiceService.findByUser(
      user.id,
      pageNum,
      limitNum,
    );

    return {
      success: true,
      data: invoices.data,
      pagination: {
        page: invoices.page,
        limit: limitNum,
        total: invoices.total,
        totalPages: invoices.totalPages,
      },
    };
  }

  /**
   * Get specific invoice details
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'id', type: 'string' })
  async getInvoice(@Param('id') invoiceId: string, @CurrentUser() user: any) {
    const invoice = await this.invoiceService.findOne(invoiceId);

    // Verify user owns this invoice
    if (invoice.userId !== user.id && user.role !== 'admin') {
      throw new BadRequestException('Access denied to this invoice');
    }

    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Download invoice as PDF
   */
  @Get(':id/download')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiParam({ name: 'id', type: 'string' })
  async downloadInvoice(
    @Param('id') invoiceId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.findOne(invoiceId);

    // Verify user owns this invoice
    if (invoice.userId !== user.id && user.role !== 'admin') {
      throw new BadRequestException('Access denied to this invoice');
    }

    const pdfUrl = await this.invoiceService.getInvoicePdfUrl(invoiceId);

    // In real implementation, stream from S3
    // For now, return URL
    return res.json({
      success: true,
      data: {
        invoiceId,
        pdfUrl,
        fileName: `invoice-${invoice.id.slice(0, 8)}.pdf`,
      },
    });
  }

  /**
   * Re-send invoice email
   */
  @Post(':id/resend')
  @UseGuards(PermissionsGuard)
  @Permissions('invoices:resend')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Re-send invoice email' })
  @ApiParam({ name: 'id', type: 'string' })
  async resendInvoice(
    @Param('id') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    const invoice = await this.invoiceService.findOne(invoiceId);

    // Verify user owns this invoice or is admin
    if (invoice.userId !== user.id && user.role !== 'admin') {
      throw new BadRequestException('Access denied to this invoice');
    }

    await this.invoiceService.resendInvoiceEmail(invoiceId);

    return {
      success: true,
      message: 'Invoice email sent successfully',
    };
  }

  /**
   * Admin: Get all invoices with filtering
   */
  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @Permissions('invoices:view_all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Get all invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllInvoices() {
    // For admin viewing - would implement filtering, sorting, etc.
    // This is a placeholder - implement as needed
    return {
      success: true,
      message: 'Admin invoice listing - implement as needed',
    };
  }
}
