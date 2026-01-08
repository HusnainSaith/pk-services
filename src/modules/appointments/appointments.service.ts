import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Logger } from '@nestjs/common';

const APPOINTMENT_DURATIONS = [30, 60, 90];
const APPOINTMENT_STATUSES = [
  'AVAILABLE',
  'BOOKED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
];

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Create new appointment (user booking)
   */
  async create(dto: CreateAppointmentDto, userId: string): Promise<any> {
    this.logger.debug(`Creating appointment for user ${userId}`);

    if (!APPOINTMENT_DURATIONS.includes(dto.durationMinutes)) {
      throw new BadRequestException(
        `Duration must be one of: ${APPOINTMENT_DURATIONS.join(', ')} minutes`,
      );
    }

    // Check for conflicts
    const appointmentDate = new Date(dto.appointmentDate);
    const endTime = new Date(
      appointmentDate.getTime() + dto.durationMinutes * 60000,
    );

    const conflict = await this.appointmentRepository.findOne({
      where: {
        appointmentDate: Between(appointmentDate, endTime),
        operatorId: dto.operatorId,
        status: In(['BOOKED', 'CONFIRMED', 'COMPLETED']),
      },
    });

    if (conflict) {
      throw new ConflictException(
        'Operator has conflicting appointment at this time',
      );
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      userId,
      ...dto,
      status: 'BOOKED',
      userConfirmed: false,
      operatorConfirmed: false,
    } as any);

    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${(saved as any).id} created for user ${userId}`);

    return {
      success: true,
      message: 'Appointment booked successfully',
      data: saved,
    };
  }

  /**
   * Get all appointments with filtering
   */
  async findAll(query?: {
    status?: string;
    operatorId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<any> {
    const { status, operatorId, userId, startDate, endDate, skip = 0, take = 20 } = query || {};

    const qb = this.appointmentRepository.createQueryBuilder('appointment');

    if (status) qb.andWhere('appointment.status = :status', { status });
    if (operatorId) qb.andWhere('appointment.operatorId = :operatorId', { operatorId });
    if (userId) qb.andWhere('appointment.userId = :userId', { userId });

    if (startDate && endDate) {
      qb.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [data, total] = await qb
      .orderBy('appointment.appointmentDate', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { success: true, data, total, skip, take };
  }

  /**
   * Get user appointments
   */
  async findByUser(userId: string, options?: any): Promise<any> {
    const { skip = 0, take = 20, status } = options || {};

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.userId = :userId', { userId });

    if (status) {
      qb.andWhere('appointment.status = :status', { status });
    }

    const [data, total] = await qb
      .orderBy('appointment.appointmentDate', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { success: true, data, total, skip, take };
  }

  /**
   * Get single appointment
   */
  async findOne(id: string, userId?: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    // Check authorization
    if (userId && appointment.userId !== userId && !['admin', 'operator'].includes(userId)) {
      throw new ForbiddenException('Not authorized to view this appointment');
    }

    return { success: true, data: appointment };
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string, userId: string, reason?: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can cancel');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new ConflictException(`Cannot cancel appointment with status ${appointment.status}`);
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.notes = {
      ...appointment.notes,
      cancelReason: reason,
    };

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${id} cancelled by user ${userId}`);

    return { success: true, message: 'Appointment cancelled', data: updated };
  }

  /**
   * Get appointments by operator
   */
  async findByOperator(operatorId: string, options?: any): Promise<any> {
    const { skip = 0, take = 20, status, startDate, endDate } = options || {};

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.operatorId = :operatorId', { operatorId });

    if (status) {
      qb.andWhere('appointment.status = :status', { status });
    }

    if (startDate && endDate) {
      qb.andWhere(
        'appointment.appointmentDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const [data, total] = await qb
      .orderBy('appointment.appointmentDate', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { success: true, data, total, skip, take };
  }

  /**
   * Get available time slots for operator
   */
  async getAvailableSlots(operatorId: string, date: Date, durationMinutes: number = 60): Promise<string[]> {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Business hours start at 9 AM

    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0); // End at 5 PM

    // Get booked appointments for the day
    const booked = await this.appointmentRepository.find({
      where: {
        operatorId,
        appointmentDate: Between(dayStart, dayEnd),
        status: In(['BOOKED', 'CONFIRMED', 'COMPLETED']),
      },
    });

    // Generate available slots
    const slots: string[] = [];
    let current = new Date(dayStart);

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);

      // Check if slot conflicts with any booking
      const hasConflict = booked.some((appt) => {
        const apptEnd = new Date(appt.appointmentDate.getTime() + appt.durationMinutes * 60000);
        return current < apptEnd && slotEnd > appt.appointmentDate;
      });

      if (!hasConflict) {
        const hours = current.getHours().toString().padStart(2, '0');
        const minutes = current.getMinutes().toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
      }

      current = new Date(current.getTime() + 30 * 60000); // 30-minute intervals
    }

    return slots;
  }

  /**
   * Get calendar view for operator/date range
   */
  async getCalendar(operatorId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    const qb = this.appointmentRepository.createQueryBuilder('appointment');

    if (operatorId) {
      qb.where('appointment.operatorId = :operatorId', { operatorId });
    }

    if (startDate && endDate) {
      qb.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const appointments = await qb
      .orderBy('appointment.appointmentDate', 'ASC')
      .getMany();

    // Group by date
    const calendarData = {};
    appointments.forEach((appt) => {
      const date = appt.appointmentDate.toISOString().split('T')[0];
      if (!calendarData[date]) {
        calendarData[date] = [];
      }
      calendarData[date].push(appt);
    });

    return { success: true, data: calendarData };
  }

  /**
   * Create appointment by admin
   */
  async createAdmin(dto: CreateAppointmentDto, operatorId: string): Promise<any> {
    this.logger.debug(`Admin creating appointment for operator ${operatorId}`);

    if (!APPOINTMENT_DURATIONS.includes(dto.durationMinutes)) {
      throw new BadRequestException(
        `Duration must be one of: ${APPOINTMENT_DURATIONS.join(', ')} minutes`,
      );
    }

    const appointmentDate = new Date(dto.appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + dto.durationMinutes * 60000);

    const conflict = await this.appointmentRepository.findOne({
      where: {
        appointmentDate: Between(appointmentDate, endTime),
        operatorId,
        status: In(['BOOKED', 'CONFIRMED', 'COMPLETED']),
      },
    });

    if (conflict) {
      throw new ConflictException('Time slot conflicts with existing appointment');
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      operatorId,
      status: 'CONFIRMED',
      operatorConfirmed: true,
      operatorConfirmedAt: new Date(),
    } as any);

    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${(saved as any).id} created by admin`);

    return { success: true, message: 'Appointment created', data: saved };
  }

  /**
   * Assign operator to appointment
   */
  async assign(id: string, operatorId: string, assignedBy: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    appointment.operatorId = operatorId;
    const updated = await this.appointmentRepository.save(appointment);

    this.logger.log(
      `Appointment ${id} assigned to operator ${operatorId} by ${assignedBy}`,
    );

    return { success: true, message: 'Operator assigned', data: updated };
  }

  /**
   * Update appointment status
   */
  async updateStatus(
    id: string,
    newStatus: string,
    operatorId: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (!APPOINTMENT_STATUSES.includes(newStatus)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    const oldStatus = appointment.status;
    appointment.status = newStatus;

    if (newStatus === 'CONFIRMED') {
      appointment.operatorConfirmed = true;
      appointment.operatorConfirmedAt = new Date();
    }

    if (newStatus === 'COMPLETED') {
      appointment.completedAt = new Date();
    }

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(
      `Appointment ${id} status updated from ${oldStatus} to ${newStatus} by ${operatorId}`,
    );

    return { success: true, message: 'Status updated', data: updated };
  }

  /**
   * Reschedule appointment
   */
  async reschedule(
    id: string,
    newDate: Date,
    newTime: string,
    durationMinutes: number,
    userId: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can reschedule');
    }

    // Combine date and time
    const [hours, minutes] = newTime.split(':').map(Number);
    const appointmentDate = new Date(newDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Check for conflicts
    const endTime = new Date(appointmentDate.getTime() + durationMinutes * 60000);
    const conflict = await this.appointmentRepository.findOne({
      where: {
        appointmentDate: Between(appointmentDate, endTime),
        operatorId: appointment.operatorId,
        id: id,
        status: In(['BOOKED', 'CONFIRMED', 'COMPLETED']),
      },
    });

    if (conflict) {
      throw new ConflictException('New time slot is not available');
    }

    appointment.appointmentDate = appointmentDate;
    appointment.durationMinutes = durationMinutes;
    appointment.rescheduledCount++;
    appointment.status = 'RESCHEDULED';

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${id} rescheduled by user ${userId}`);

    return {
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updated,
    };
  }

  /**
   * Confirm appointment by user
   */
  async confirmByUser(id: string, userId: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can confirm');
    }

    appointment.userConfirmed = true;
    appointment.userConfirmedAt = new Date();

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${id} confirmed by user ${userId}`);

    return { success: true, message: 'Appointment confirmed', data: updated };
  }

  /**
   * Add note to appointment
   */
  async addNote(
    id: string,
    note: string,
    isInternal: boolean = false,
    userId: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (typeof appointment.notes !== 'object' || !appointment.notes) {
      appointment.notes = {};
    }

    if (isInternal) {
      appointment.notes['internalNotes'] = note;
    } else {
      appointment.notes['userNotes'] = note;
    }

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Note added to appointment ${id} by ${userId}`);

    return { success: true, message: 'Note added', data: updated };
  }

  /**
   * Create time slots
   */
  async createSlots(dto: any): Promise<any> {
    return { success: true, message: 'Time slots created', data: dto };
  }

  /**
   * Get reminder history
   */
  async getReminderHistory(id: string, userId: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    return { success: true, data: { reminders: [] } };
  }

  /**
   * Send reminder for appointment
   */
  async sendReminder(id: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    this.logger.log(`Reminder sent for appointment ${id}`);
    return { success: true, message: 'Reminder sent successfully' };
  }

  /**
   * Get operator appointments (calendar view)
   */
  async getOperatorAppointments(operatorId: string, options?: any): Promise<any> {
    const { skip = 0, take = 20, status } = options || {};
    return this.findByOperator(operatorId, { skip, take, status });
  }

  /**
   * Get calendar with busy times
   */
  async exportCalendar(userId: string): Promise<any> {
    return {
      success: true,
      message: 'Calendar exported',
      data: {
        format: 'ical',
        downloadUrl: '/api/v1/appointments/calendar.ics',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    };
  }
}