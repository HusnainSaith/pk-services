import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.configService.get<boolean>('NOTIFICATION_ENABLED')) {
      return;
    }

    try {
      const mailOptions = {
        from: {
          name: this.configService.get<string>('EMAIL_FROM_NAME'),
          address: this.configService.get<string>('EMAIL_FROM_ADDRESS'),
        },
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendWelcomeEmail(user: any) {
    const subject = 'Benvenuto in PK SERVIZI';
    const html = `
      <h2>Benvenuto ${user.fullName}!</h2>
      <p>Il tuo account è stato creato con successo.</p>
      <p>Ora puoi accedere ai nostri servizi CAF.</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendServiceRequestSubmitted(user: any, request: any) {
    const subject = 'Richiesta di servizio inviata';
    const html = `
      <h2>Richiesta inviata con successo</h2>
      <p>Caro ${user.fullName},</p>
      <p>La tua richiesta per il servizio <strong>${request.serviceType?.name}</strong> è stata inviata.</p>
      <p>ID Richiesta: ${request.id}</p>
      <p>Ti contatteremo presto per l'elaborazione.</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendServiceRequestStatusUpdate(
    user: any,
    request: any,
    oldStatus: string,
    newStatus: string,
  ) {
    const subject = 'Aggiornamento stato richiesta';
    const html = `
      <h2>Stato richiesta aggiornato</h2>
      <p>Caro ${user.fullName},</p>
      <p>Lo stato della tua richiesta <strong>${request.serviceType?.name}</strong> è cambiato:</p>
      <p>Da: <strong>${oldStatus}</strong> → A: <strong>${newStatus}</strong></p>
      <p>ID Richiesta: ${request.id}</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendAppointmentConfirmation(user: any, appointment: any) {
    const subject = 'Conferma appuntamento';
    const html = `
      <h2>Appuntamento confermato</h2>
      <p>Caro ${user.fullName},</p>
      <p>Il tuo appuntamento è stato confermato:</p>
      <p><strong>Data:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('it-IT')}</p>
      <p><strong>Ora:</strong> ${new Date(appointment.appointmentDate).toLocaleTimeString('it-IT')}</p>
      <p><strong>Servizio:</strong> ${appointment.title}</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendAppointmentReminder(user: any, appointment: any) {
    const subject = 'Promemoria appuntamento';
    const html = `
      <h2>Promemoria appuntamento</h2>
      <p>Caro ${user.fullName},</p>
      <p>Ti ricordiamo il tuo appuntamento di domani:</p>
      <p><strong>Data:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('it-IT')}</p>
      <p><strong>Ora:</strong> ${new Date(appointment.appointmentDate).toLocaleTimeString('it-IT')}</p>
      <p><strong>Servizio:</strong> ${appointment.title}</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendDocumentApproved(user: any, document: any) {
    const subject = 'Documento approvato';
    const html = `
      <h2>Documento approvato</h2>
      <p>Caro ${user.fullName},</p>
      <p>Il tuo documento <strong>${document.originalFilename}</strong> è stato approvato.</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendDocumentRejected(user: any, document: any, reason: string) {
    const subject = 'Documento respinto';
    const html = `
      <h2>Documento respinto</h2>
      <p>Caro ${user.fullName},</p>
      <p>Il tuo documento <strong>${document.originalFilename}</strong> è stato respinto.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Ti preghiamo di caricare un nuovo documento.</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPaymentSuccess(user: any, payment: any) {
    const subject = 'Pagamento confermato';
    const html = `
      <h2>Pagamento ricevuto</h2>
      <p>Caro ${user.fullName},</p>
      <p>Il tuo pagamento di €${payment.amount} è stato elaborato con successo.</p>
      <p>ID Transazione: ${payment.id}</p>
      <p>Cordiali saluti,<br>Il team PK SERVIZI</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
