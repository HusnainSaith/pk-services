import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { jsPDF } from 'jspdf';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate invoice for completed payment
   * Called from payment webhook handler
   */
  async generateInvoiceFromPayment(paymentId: string): Promise<Invoice> {
    try {
      // Check if invoice already exists
      const existing = await this.invoiceRepository.findOne({
        where: { paymentId },
      });

      if (existing) {
        this.logger.log(`Invoice already exists for payment ${paymentId}`);
        return existing;
      }

      // Get payment with user info
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
        relations: ['user', 'subscription'],
      });

      if (!payment) {
        throw new NotFoundException(`Payment not found: ${paymentId}`);
      }

      if (payment.status !== 'completed') {
        throw new BadRequestException(
          `Cannot generate invoice for payment with status: ${payment.status}`,
        );
      }

      // Get user details
      const user = payment.user;
      if (!user) {
        throw new NotFoundException(`User not found for payment ${paymentId}`);
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Get user with profile for billing info
      const userWithProfile = await this.userRepository.findOne({
        where: { id: payment.userId },
        relations: ['profile'],
      });

      const profile = userWithProfile?.profile;

      // Create invoice record
      const invoice = new Invoice();
      invoice.paymentId = paymentId;
      invoice.userId = payment.userId;
      invoice.amount = payment.amount;
      invoice.currency = payment.currency;
      invoice.status = 'draft';
      invoice.invoiceNumber = invoiceNumber;
      invoice.issuedAt = new Date();
      invoice.paidAt = payment.paidAt || new Date();
      invoice.stripeInvoiceId = payment.metadata?.stripeInvoiceId || null;

      // Set billing info from profile
      invoice.billing = {
        name: user.fullName,
        email: user.email,
        address: profile?.address || '',
        city: profile?.city || '',
        postalCode: profile?.postalCode || '',
        country: 'IT',
        fiscalCode: profile?.fiscalCode || '',
      };

      // Create line items
      invoice.lineItems = [
        {
          description:
            payment.description || 'PK SERVIZI Professional Services',
          quantity: 1,
          amount: payment.amount,
          currency: payment.currency,
        },
      ];

      // Save invoice
      const savedInvoice = await this.invoiceRepository.save(invoice);
      this.logger.log(`Invoice created for payment ${paymentId}`);

      // Generate PDF (async, don't block)
      this.generateAndUploadPDF(savedInvoice).catch((error) => {
        this.logger.error(
          `Failed to generate PDF for invoice ${savedInvoice.id}: ${error.message}`,
        );
      });

      return savedInvoice;
    } catch (error) {
      this.logger.error(
        `Failed to generate invoice for payment ${paymentId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate PDF and upload to storage
   */
  private async generateAndUploadPDF(invoice: Invoice): Promise<void> {
    try {
      // Generate PDF content
      await this.createPdfBuffer(invoice);

      // In real implementation, upload to S3
      // For now, store path locally or in metadata
      invoice.pdfPath = `/invoices/${invoice.id}.pdf`;
      invoice.status = 'sent';
      invoice.sentAt = new Date();

      await this.invoiceRepository.save(invoice);

      // Note: Email is sent by webhook handler, not here
      // This prevents duplicate emails when payment is completed

      this.logger.log(`PDF generated for invoice ${invoice.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for invoice ${invoice.id}: ${error.message}`,
      );
    }
  }

  /**
   * Create PDF buffer for invoice
   */
  private async createPdfBuffer(invoice: Invoice): Promise<Buffer> {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('INVOICE', 20, 20);

      // Company info
      doc.setFontSize(10);
      doc.text('PK SERVIZI S.R.L.', 20, 35);
      doc.text('Professional Services', 20, 42);
      doc.text('Email: support@pkservizi.com', 20, 49);
      doc.text('Phone: +39 XXX XXX XXXX', 20, 56);

      // Invoice details
      doc.setFontSize(11);
      doc.text(
        `Invoice #: ${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
        20,
        75,
      );
      doc.text(
        `Date: ${
          invoice.issuedAt
            ? invoice.issuedAt.toLocaleDateString()
            : new Date().toLocaleDateString()
        }`,
        20,
        82,
      );
      if (invoice.paidAt) {
        doc.text(`Paid: ${invoice.paidAt.toLocaleDateString()}`, 20, 89);
      }

      // Bill To
      doc.setFontSize(11);
      doc.text('Bill To:', 20, 100);
      doc.setFontSize(10);
      doc.text(invoice.billing.name, 20, 107);
      doc.text(invoice.billing.email, 20, 114);
      if (invoice.billing.fiscalCode) {
        doc.text(`Fiscal Code: ${invoice.billing.fiscalCode}`, 20, 121);
        doc.text(invoice.billing.address, 20, 128);
        doc.text(
          `${invoice.billing.city} ${invoice.billing.postalCode}`,
          20,
          135,
        );
      } else {
        doc.text(invoice.billing.address, 20, 121);
        doc.text(
          `${invoice.billing.city} ${invoice.billing.postalCode}`,
          20,
          128,
        );
      }

      // Line items table
      const startY = invoice.billing.fiscalCode ? 150 : 145;
      const colX = [20, 100, 160];

      // Headers
      doc.setFillColor(240, 240, 240);
      doc.rect(colX[0] - 5, startY, 140, 7, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Description', colX[0], startY + 5);
      doc.text('Qty', colX[1], startY + 5);
      doc.text('Amount', colX[2], startY + 5);

      // Line items
      doc.setFont(undefined, 'normal');
      let yPos = startY + 15;

      invoice.lineItems.forEach((item) => {
        doc.text(item.description, colX[0], yPos);
        doc.text(item.quantity.toString(), colX[1], yPos);
        doc.text(
          `${Number(item.amount).toFixed(2)} ${item.currency}`,
          colX[2],
          yPos,
        );
        yPos += 7;
      });

      // Total
      doc.setFont(undefined, 'bold');
      doc.text('Total:', colX[1], yPos + 10);
      doc.text(
        `${Number(invoice.amount).toFixed(2)} ${invoice.currency}`,
        colX[2],
        yPos + 10,
      );

      // Footer
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });

      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      this.logger.error(`Failed to create PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send invoice email to user
   */
  private async sendInvoiceEmail(invoice: Invoice): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: invoice.userId },
      });

      if (!user) {
        this.logger.warn(`User not found for invoice ${invoice.id}`);
        return;
      }

      await this.notificationsService.sendEmail({
        to: user.email,
        subject: `Invoice #${invoice.id.slice(0, 8)} - PK SERVIZI`,
        template: 'invoice',
        context: {
          userName: user.fullName || user.email,
          invoiceNumber: invoice.id.slice(0, 8),
          amount: invoice.amount,
          currency: invoice.currency,
          date: invoice.issuedAt || new Date(),
          invoiceUrl: `${this.configService.get('FRONTEND_URL')}/invoices/${invoice.id}/download`,
        },
      });

      this.logger.log(`Invoice email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email: ${error.message}`);
      // Don't throw - email failure shouldn't block invoice creation
    }
  }

  /**
   * Get invoice by ID
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['payment', 'user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice not found: ${id}`);
    }

    return invoice;
  }

  /**
   * Get invoices for user
   */
  async findByUser(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.invoiceRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['payment'],
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Get invoice PDF URL for download
   */
  async getInvoicePdfUrl(invoiceId: string): Promise<string> {
    const invoice = await this.findOne(invoiceId);

    if (!invoice.pdfUrl && !invoice.pdfPath) {
      throw new BadRequestException(
        `PDF not available for invoice ${invoiceId}`,
      );
    }

    return invoice.pdfUrl || invoice.pdfPath;
  }

  /**
   * Re-send invoice email
   */
  async resendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await this.findOne(invoiceId);
    await this.sendInvoiceEmail(invoice);
  }

  /**
   * Generate unique invoice number
   * Format: INV-YYYY-NNNNN (e.g., INV-2026-00001)
   */
  private async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `INV-${currentYear}`;

    // Get the count of invoices created this year
    const count = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', {
        prefix: `${yearPrefix}-%`,
      })
      .getCount();

    // Generate next number with padding
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `${yearPrefix}-${nextNumber}`;
  }
}
