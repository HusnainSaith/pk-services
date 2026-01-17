import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { EmailService } from './email.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async findByUser(userId: string): Promise<any> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: notifications };
  }

  async getUnreadCount(userId: string): Promise<any> {
    const count = await this.notificationRepository.count({
      where: { userId, readAt: null },
    });
    return { success: true, count };
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    await this.notificationRepository.update(
      { id, userId },
      { readAt: new Date(), isRead: true },
    );
    const updated = await this.notificationRepository.findOne({
      where: { id },
    });
    return {
      success: true,
      message: 'Notification marked as read',
      data: updated,
    };
  }

  async markEmailAsRead(notificationId: string): Promise<any> {
    // Mark notification as read when email tracking pixel is loaded
    this.logger.log(
      'Email tracking pixel loaded for notification: ' + notificationId,
    );

    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (notification) {
      this.logger.log(
        'Found notification: ' +
          notificationId +
          ', current read_at: ' +
          notification.readAt,
      );

      if (!notification.readAt) {
        notification.readAt = new Date();
        notification.isRead = true;
        await this.notificationRepository.save(notification);
        this.logger.log(
          'Email marked as read at: ' +
            notification.readAt +
            ', is_read set to true',
        );
      } else {
        this.logger.log(
          'Email was already marked as read at: ' + notification.readAt,
        );
      }
    } else {
      this.logger.warn('Notification not found: ' + notificationId);
    }

    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<any> {
    await this.notificationRepository.update(
      { userId, readAt: null },
      { readAt: new Date(), isRead: true },
    );
    return { success: true, message: 'All notifications marked as read' };
  }

  async remove(id: string): Promise<any> {
    await this.notificationRepository.delete(id);
    return { success: true, message: 'Notification deleted' };
  }

  async send(dto: any): Promise<any> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      select: ['id', 'email'],
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const notification = this.notificationRepository.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'info',
      metadata: dto.data,
    });
    const saved = await this.notificationRepository.save(notification);

    // Send email asynchronously (don't wait)
    const userEmail = dto.userEmail || user.email;
    if (userEmail) {
      setImmediate(() => {
        let htmlContent = dto.htmlContent || `<p>${dto.message}</p>`;

        // Add tracking pixel to HTML content if notification ID exists
        if (saved.id) {
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
          const trackingPixel = `<img src="${backendUrl}/api/v1/notifications/track/${saved.id}" width="1" height="1" style="display:none;" alt="" />`;

          this.logger.log(
            'Adding tracking pixel for notification: ' + saved.id,
          );
          this.logger.log(
            'Tracking URL: ' +
              backendUrl +
              '/api/v1/notifications/track/' +
              saved.id,
          );

          // Insert tracking pixel before closing body tag, or append if no body tag
          if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace(
              '</body>',
              trackingPixel + '</body>',
            );
          } else {
            htmlContent = htmlContent + trackingPixel;
          }
        }

        this.emailService
          .sendEmail(userEmail, dto.title, htmlContent, dto.message)
          .catch((error) => {
            console.error('Failed to send email:', error);
          });
      });
    }

    return { success: true, message: 'Notification sent', data: saved };
  }

  async broadcast(dto: any): Promise<any> {
    const users = await this.userRepository.find({
      select: ['id', 'email'],
    });

    const notifications = users.map((user) =>
      this.notificationRepository.create({
        userId: user.id,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'info',
        metadata: dto.data,
      }),
    );

    await this.notificationRepository.save(notifications);

    // Send emails asynchronously
    setImmediate(() => {
      users.forEach((user) => {
        if (user.email) {
          this.emailService
            .sendEmail(
              user.email,
              dto.title,
              `<p>${dto.message}</p>`,
              dto.message,
            )
            .catch((error) => {
              console.error(`Failed to send email to ${user.email}:`, error);
            });
        }
      });
    });

    return {
      success: true,
      message: 'Notification broadcasted',
      count: notifications.length,
    };
  }

  async sendToRole(dto: any): Promise<any> {
    return { success: true, message: 'Notification sent to role', count: 0 };
  }

  async deleteOldNotifications(days: number = 30): Promise<any> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
    return {
      success: true,
      message: `Old notifications deleted`,
      deletedCount: result.affected,
    };
  }

  /**
   * Send templated email (for invoices, password resets, etc.)
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    template?: string;
    context?: any;
  }): Promise<void> {
    try {
      const htmlContent = this.renderEmailTemplate(
        options.template,
        options.context,
      );
      await this.emailService.sendEmail(
        options.to,
        options.subject,
        htmlContent,
      );
    } catch (error) {
      console.error(`Failed to send email to ${options.to}:`, error);
      // Don't throw - email delivery shouldn't block application flow
    }
  }

  /**
   * Render email template with context
   */
  private renderEmailTemplate(template: string, context: any = {}): string {
    const templates = {
      invoice: this.invoiceEmailTemplate,
      'password-reset': this.passwordResetTemplate,
      welcome: this.welcomeTemplate,
      confirmation: this.confirmationTemplate,
    };

    const renderFn = templates[template] || templates['confirmation'];
    return renderFn(context);
  }

  /**
   * Invoice email template
   */
  private invoiceEmailTemplate = (context: any): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
          .invoice-section { margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #007bff; }
          .footer { border-top: 1px solid #ddd; padding-top: 20px; margin-top: 40px; font-size: 12px; color: #666; }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice Received</h1>
            <p>Hello ${context.userName || 'Customer'},</p>
          </div>

          <div class="invoice-section">
            <p>We're pleased to inform you that your payment has been successfully processed.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <p><strong>Invoice Details:</strong></p>
              <p>Invoice Number: <strong>${context.invoiceNumber}</strong></p>
              <p>Date: <strong>${context.date ? new Date(context.date).toLocaleDateString() : 'N/A'}</strong></p>
              <p>Amount: <span class="amount">${context.amount} ${context.currency}</span></p>
            </div>
          </div>

          <div class="invoice-section">
            <p>You can download your invoice using the button below:</p>
            <a href="${context.invoiceUrl}" class="button">Download Invoice</a>
          </div>

          <div class="invoice-section">
            <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
          </div>

          <div class="footer">
            <p><strong>PK SERVIZI S.R.L.</strong></p>
            <p>Professional Services</p>
            <p>Email: support@pkservizi.com | Phone: +39 XXX XXX XXXX</p>
            <p>© 2026 PK SERVIZI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  /**
   * Password reset email template
   */
  private passwordResetTemplate = (context: any): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${context.userName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${context.resetUrl}" class="button">Reset Password</a>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  /**
   * Welcome email template
   */
  private welcomeTemplate = (context: any): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to PK SERVIZI!</h2>
          <p>Hello ${context.userName},</p>
          <p>Thank you for joining PK SERVIZI. Your account is now active.</p>
          <p>You can now log in and start using our professional services.</p>
        </div>
      </body>
    </html>
  `;

  /**
   * Generic confirmation template
   */
  private confirmationTemplate = (context: any): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${context.title || 'Notification'}</h2>
          <p>Hello ${context.userName},</p>
          <p>${context.message}</p>
        </div>
      </body>
    </html>
  `;
}
