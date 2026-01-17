import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { UserRequest } from '../../common/interfaces/user-request.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateAppointmentAdminDto } from './dto/create-appointment-admin.dto';
import { AssignOperatorDto } from './dto/assign-operator.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateTimeSlotsDto } from './dto/create-time-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Public Routes
  @Get('available-slots')
  @ApiOperation({ summary: '[Public] Get available time slots for booking' })
  @ApiQuery({
    name: 'operatorId',
    required: false,
    description: 'Specific operator ID',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    description: 'Duration in minutes (30, 60, 90)',
  })
  async getAvailableSlots(
    @Query('operatorId') operatorId?: string,
    @Query('date') date?: string,
    @Query('duration') duration?: string,
  ) {
    const appointmentDate = date ? new Date(date) : new Date();
    const durationMinutes = duration ? parseInt(duration) : 60;

    const slots = await this.appointmentsService.getAvailableSlots(
      operatorId,
      appointmentDate,
      durationMinutes,
    );

    return {
      success: true,
      data: {
        date: appointmentDate.toISOString().split('T')[0],
        operatorId,
        duration: durationMinutes,
        availableSlots: slots,
      },
    };
  }

  // Customer Routes
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Book a new appointment' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: UserRequest) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get my appointments' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  findMy(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const options = {
      status,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    };
    return this.appointmentsService.findByUser(user.id, options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get appointment details' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserRequest) {
    return this.appointmentsService.findOne(id, user.id);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:reschedule')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Reschedule appointment' })
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.appointmentsService.reschedule(
      id,
      dto.newDateTime,
      user.id,
      dto.reason,
    );
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Confirm appointment' })
  confirm(@Param('id') id: string, @CurrentUser() user: UserRequest) {
    return this.appointmentsService.confirmByUser(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Cancel appointment' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserRequest,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentsService.cancel(id, user.id, reason);
  }

  // Admin/Operator Routes
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all appointments' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'operatorId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('operatorId') operatorId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const query = {
      status,
      operatorId,
      userId,
      startDate,
      endDate,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    };
    return this.appointmentsService.findAll(query);
  }

  @Get('calendar/view')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get calendar view' })
  @ApiQuery({ name: 'operatorId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCalendar(
    @Query('operatorId') operatorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getCalendar(
      operatorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:assign')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Assign operator to appointment' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignOperatorDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.appointmentsService.assign(id, dto.operatorId, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update appointment status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      dto.status,
      user.id,
      dto.reason,
    );
  }

  @Get('operator/:operatorId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get operator appointments' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  getOperatorAppointments(
    @Param('operatorId') operatorId: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const options = {
      status,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    };
    return this.appointmentsService.getOperatorAppointments(
      operatorId,
      options,
    );
  }

  // Additional Features
  @Post(':id/notes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Add note to appointment' })
  addNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Body('isInternal') isInternal: boolean = false,
    @CurrentUser() user: UserRequest,
  ) {
    return this.appointmentsService.addNote(id, note, isInternal, user.id);
  }

  @Get(':id/reminders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get reminder history' })
  getReminderHistory(
    @Param('id') id: string,
    @CurrentUser() user: UserRequest,
  ) {
    return this.appointmentsService.getReminderHistory(id, user.id);
  }

  @Post(':id/send-reminder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Send appointment reminder' })
  sendReminder(@Param('id') id: string) {
    return this.appointmentsService.sendReminder(id);
  }

  @Get('export/calendar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Export calendar (iCal format)' })
  exportCalendar(@CurrentUser() user: UserRequest) {
    return this.appointmentsService.exportCalendar(user.id);
  }

  // Time Slots Management
  @Post('slots')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create time slots' })
  createSlots(@Body() dto: CreateTimeSlotsDto) {
    return this.appointmentsService.createSlots(dto);
  }
}
