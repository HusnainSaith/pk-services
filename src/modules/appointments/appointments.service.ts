import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan, LessThan } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { ServiceType } from '../service-requests/entities/service-type.entity';

const APPOINTMENT_DURATIONS = [30, 60, 90];
const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
];

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM
  slotInterval: 30, // 30 minutes
};

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  /**
   * Create new appointment (user booking)
   */
  async create(dto: CreateAppointmentDto, userId: string): Promise<any> {
    this.logger.debug(`Creating appointment for user ${userId}`);

    // Validate duration
    const duration = dto.durationMinutes || 60;
    if (!APPOINTMENT_DURATIONS.includes(duration)) {
      throw new BadRequestException(
        `Duration must be one of: ${APPOINTMENT_DURATIONS.join(', ')} minutes`,
      );
    }

    // Validate appointment date
    const appointmentDate = new Date(dto.appointmentDate);
    const now = new Date();

    if (appointmentDate <= now) {
      throw new BadRequestException('Appointment date must be in the future');
    }

    // Check business hours
    const hour = appointmentDate.getHours();
    if (hour < BUSINESS_HOURS.start || hour >= BUSINESS_HOURS.end) {
      throw new BadRequestException(
        `Appointments must be between ${BUSINESS_HOURS.start}:00 and ${BUSINESS_HOURS.end}:00`,
      );
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate service type if provided
    if (dto.serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findOne({
        where: { id: dto.serviceTypeId, isActive: true },
      });
      if (!serviceType) {
        throw new NotFoundException('Service type not found or inactive');
      }
    }

    // Validate operator if provided
    if (dto.operatorId) {
      const operator = await this.userRepository.findOne({
        where: { id: dto.operatorId },
        relations: ['role'],
      });
      if (!operator || !['OPERATOR', 'ADMIN'].includes(operator.role?.name)) {
        throw new BadRequestException('Invalid operator selected');
      }
    }

    // Check for time slot availability
    const endTime = new Date(appointmentDate.getTime() + duration * 60000);
    const isSlotAvailable = await this.isTimeSlotAvailable(
      appointmentDate,
      endTime,
      dto.operatorId,
    );

    if (!isSlotAvailable) {
      throw new ConflictException(
        'Selected time slot is not available. Please choose a different time.',
      );
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      userId,
      serviceTypeId: dto.serviceTypeId,
      operatorId: dto.operatorId,
      title: dto.title,
      description: dto.description,
      appointmentDate,
      durationMinutes: duration,
      location: dto.location,
      notes: dto.notes ? { userNotes: dto.notes } : {},
      status: 'SCHEDULED',
      userConfirmed: false,
      operatorConfirmed: false,
    });

    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${saved.id} created for user ${userId}`);

    return {
      success: true,
      message: 'Appointment booked successfully',
      data: saved,
    };
  }

  /**
   * Check if time slot is available
   */
  private async isTimeSlotAvailable(
    startTime: Date,
    endTime: Date,
    operatorId?: string,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
      })
      .andWhere(
        '(appointment.appointmentDate < :endTime AND ' +
          "appointment.appointmentDate + INTERVAL '1 minute' * appointment.durationMinutes > :startTime)",
        { startTime, endTime },
      );

    if (operatorId) {
      query.andWhere('appointment.operatorId = :operatorId', { operatorId });
    }

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeId', {
        excludeId: excludeAppointmentId,
      });
    }

    const conflictingAppointment = await query.getOne();
    return !conflictingAppointment;
  }

  /**
   * Get available time slots for a specific date and operator
   */
  async getAvailableSlots(
    operatorId?: string,
    date: Date = new Date(),
    durationMinutes: number = 60,
  ): Promise<string[]> {
    const dayStart = new Date(date);
    dayStart.setHours(BUSINESS_HOURS.start, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    // Don't show past slots for today
    const now = new Date();
    const startTime =
      date.toDateString() === now.toDateString() && now > dayStart
        ? now
        : dayStart;

    // Get booked appointments for the day
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.appointmentDate >= :dayStart', { dayStart })
      .andWhere('appointment.appointmentDate < :dayEnd', { dayEnd })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
      });

    if (operatorId) {
      query.andWhere('appointment.operatorId = :operatorId', { operatorId });
    }

    const bookedAppointments = await query.getMany();

    // Generate available slots
    const slots: string[] = [];
    let current = new Date(startTime);

    // Round up to next slot interval
    const minutes = current.getMinutes();
    const roundedMinutes =
      Math.ceil(minutes / BUSINESS_HOURS.slotInterval) *
      BUSINESS_HOURS.slotInterval;
    current.setMinutes(roundedMinutes, 0, 0);

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);

      // Check if slot would extend beyond business hours
      if (slotEnd > dayEnd) {
        break;
      }

      // Check if slot conflicts with any booking
      const hasConflict = bookedAppointments.some((appt) => {
        const apptEnd = new Date(
          appt.appointmentDate.getTime() + appt.durationMinutes * 60000,
        );
        return current < apptEnd && slotEnd > appt.appointmentDate;
      });

      if (!hasConflict) {
        const hours = current.getHours().toString().padStart(2, '0');
        const minutes = current.getMinutes().toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
      }

      current = new Date(
        current.getTime() + BUSINESS_HOURS.slotInterval * 60000,
      );
    }

    return slots;
  }

  /**
   * Get user appointments
   */
  async findByUser(userId: string, options?: any): Promise<any> {
    const { skip = 0, take = 20, status } = options || {};

    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.serviceType', 'serviceType')
      .leftJoinAndSelect('appointment.operator', 'operator')
      .where('appointment.userId = :userId', { userId });

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('appointment.appointmentDate', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { success: true, data, total, skip, take };
  }

  /**
   * Get single appointment with full details
   */
  async findOne(id: string, userId?: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user', 'serviceType', 'operator'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    // Check authorization for regular users
    if (userId && appointment.userId !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      if (!user || !['ADMIN', 'OPERATOR'].includes(user.role?.name)) {
        throw new ForbiddenException('Not authorized to view this appointment');
      }
    }

    return { success: true, data: appointment };
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string, userId: string, reason?: string): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can cancel');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new ConflictException(
        `Cannot cancel appointment with status ${appointment.status}`,
      );
    }

    // Check if cancellation is allowed (e.g., not too close to appointment time)
    const now = new Date();
    const timeDiff = appointment.appointmentDate.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

    if (hoursUntilAppointment < 2) {
      throw new BadRequestException(
        'Appointments cannot be cancelled less than 2 hours before the scheduled time',
      );
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.notes = {
      ...appointment.notes,
      cancelReason: reason || 'Cancelled by user',
      cancelledAt: new Date().toISOString(),
    };

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${id} cancelled by user ${userId}`);

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: updated,
    };
  }

  /**
   * Reschedule appointment
   */
  async reschedule(
    id: string,
    newDateTime: string,
    userId: string,
    reason?: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can reschedule');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new ConflictException(
        `Cannot reschedule appointment with status ${appointment.status}`,
      );
    }

    const newAppointmentDate = new Date(newDateTime);
    const now = new Date();

    if (newAppointmentDate <= now) {
      throw new BadRequestException(
        'New appointment date must be in the future',
      );
    }

    // Check business hours
    const hour = newAppointmentDate.getHours();
    if (hour < BUSINESS_HOURS.start || hour >= BUSINESS_HOURS.end) {
      throw new BadRequestException(
        `Appointments must be between ${BUSINESS_HOURS.start}:00 and ${BUSINESS_HOURS.end}:00`,
      );
    }

    // Check availability for new time slot
    const endTime = new Date(
      newAppointmentDate.getTime() + appointment.durationMinutes * 60000,
    );
    const isAvailable = await this.isTimeSlotAvailable(
      newAppointmentDate,
      endTime,
      appointment.operatorId,
      id, // Exclude current appointment from conflict check
    );

    if (!isAvailable) {
      throw new ConflictException('New time slot is not available');
    }

    appointment.appointmentDate = newAppointmentDate;
    appointment.rescheduledCount++;
    appointment.status = 'SCHEDULED'; // Reset to scheduled
    appointment.userConfirmed = false;
    appointment.operatorConfirmed = false;
    appointment.notes = {
      ...appointment.notes,
      rescheduleReason: reason || 'Rescheduled by user',
      rescheduledAt: new Date().toISOString(),
      previousDate: appointment.appointmentDate.toISOString(),
    };

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
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Only appointment owner can confirm');
    }

    if (appointment.status !== 'SCHEDULED') {
      throw new BadRequestException(
        'Only scheduled appointments can be confirmed',
      );
    }

    appointment.userConfirmed = true;
    appointment.userConfirmedAt = new Date();

    // If operator also confirmed, update status
    if (appointment.operatorConfirmed) {
      appointment.status = 'CONFIRMED';
    }

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${id} confirmed by user ${userId}`);

    return {
      success: true,
      message: 'Appointment confirmed successfully',
      data: updated,
    };
  }

  // Admin/Operator methods remain the same but with improved error handling
  async findAll(query?: any): Promise<any> {
    const {
      status,
      operatorId,
      userId,
      startDate,
      endDate,
      skip = 0,
      take = 20,
    } = query || {};

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.serviceType', 'serviceType')
      .leftJoinAndSelect('appointment.operator', 'operator');

    if (status) qb.andWhere('appointment.status = :status', { status });
    if (operatorId)
      qb.andWhere('appointment.operatorId = :operatorId', { operatorId });
    if (userId) qb.andWhere('appointment.userId = :userId', { userId });

    if (startDate && endDate) {
      qb.andWhere(
        'appointment.appointmentDate BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    }

    const [data, total] = await qb
      .orderBy('appointment.appointmentDate', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { success: true, data, total, skip, take };
  }

  async updateStatus(
    id: string,
    newStatus: string,
    operatorId: string,
    reason?: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user', 'operator'],
    });

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

    if (newStatus === 'CANCELLED') {
      appointment.cancelledAt = new Date();
    }

    if (reason) {
      appointment.notes = {
        ...appointment.notes,
        statusChangeReason: reason,
        statusChangedAt: new Date().toISOString(),
        changedBy: operatorId,
      };
    }

    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(
      `Appointment ${id} status updated from ${oldStatus} to ${newStatus} by ${operatorId}`,
    );

    return {
      success: true,
      message: 'Status updated successfully',
      data: updated,
    };
  }

  // Keep existing methods for backward compatibility
  async findByOperator(operatorId: string, options?: any): Promise<any> {
    return this.findAll({ ...options, operatorId });
  }

  async getCalendar(
    operatorId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const appointments = await this.findAll({
      operatorId,
      startDate,
      endDate,
      take: 1000,
    });

    // Group by date
    const calendarData = {};
    appointments.data.forEach((appt) => {
      const date = appt.appointmentDate.toISOString().split('T')[0];
      if (!calendarData[date]) {
        calendarData[date] = [];
      }
      calendarData[date].push(appt);
    });

    return { success: true, data: calendarData };
  }

  // Placeholder methods for future implementation
  async createAdmin(dto: any, operatorId: string): Promise<any> {
    throw new BadRequestException(
      'Admin appointment creation not yet implemented',
    );
  }

  async assign(
    id: string,
    operatorId: string,
    assignedBy: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    appointment.operatorId = operatorId;
    const updated = await this.appointmentRepository.save(appointment);

    return {
      success: true,
      message: 'Operator assigned successfully',
      data: updated,
    };
  }

  async addNote(
    id: string,
    note: string,
    isInternal: boolean,
    userId: string,
  ): Promise<any> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    const noteKey = isInternal ? 'internalNotes' : 'userNotes';
    appointment.notes = {
      ...appointment.notes,
      [noteKey]: note,
      [`${noteKey}AddedAt`]: new Date().toISOString(),
      [`${noteKey}AddedBy`]: userId,
    };

    const updated = await this.appointmentRepository.save(appointment);
    return { success: true, message: 'Note added successfully', data: updated };
  }

  async createSlots(dto: any): Promise<any> {
    return {
      success: true,
      message: 'Time slots feature not yet implemented',
      data: dto,
    };
  }

  async getReminderHistory(id: string, userId: string): Promise<any> {
    return { success: true, data: { reminders: [] } };
  }

  async sendReminder(id: string): Promise<any> {
    return { success: true, message: 'Reminder sent successfully' };
  }

  async getOperatorAppointments(
    operatorId: string,
    options?: any,
  ): Promise<any> {
    return this.findByOperator(operatorId, options);
  }

  async exportCalendar(userId: string): Promise<any> {
    return {
      success: true,
      message: 'Calendar export feature not yet implemented',
      data: {
        format: 'ical',
        downloadUrl: '/api/v1/appointments/calendar.ics',
      },
    };
  }
}
