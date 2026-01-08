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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
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
  @ApiOperation({ summary: 'Get available time slots' })
  getAvailableSlots(@Query('operatorId') operatorId?: string, @Query('date') date?: string) {
    return this.appointmentsService.getAvailableSlots(operatorId, date ? new Date(date) : new Date());
  }

  // Customer Routes
  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List my appointments' })
  findMy(@CurrentUser() user: any) {
    return this.appointmentsService.findByUser(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Book appointment' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get appointment details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.findOne(id, user.id);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto, @CurrentUser() user: any) {
    const dateTime = new Date(dto.newDateTime);
    const newDate = dateTime;
    const newTime = dateTime.toLocaleTimeString();
    return this.appointmentsService.reschedule(id, newDate, newTime, 60, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.cancel(id, user.id);
  }

  // Extended Operations - Reminders & Calendar
  @Get(':id/reminders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get reminder history' })
  getReminderHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.getReminderHistory(id, user.id);
  }

  @Post(':id/send-reminder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger reminder' })
  sendReminder(@Param('id') id: string) {
    return this.appointmentsService.sendReminder(id);
  }

  @Get('export-calendar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export calendar (iCal format)' })
  exportCalendar(@CurrentUser() user: any) {
    return this.appointmentsService.exportCalendar(user.id);
  }

  // Admin/Operator Routes
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all appointments' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get calendar view' })
  getCalendar() {
    return this.appointmentsService.getCalendar();
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:assign')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign operator' })
  assign(@Param('id') id: string, @Body() dto: AssignOperatorDto, @CurrentUser() user: any) {
    return this.appointmentsService.assign(id, dto.operatorId, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.appointmentsService.updateStatus(id, dto.status, user.id);
  }

  @Post('slots')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create time slots' })
  createSlots(@Body() dto: CreateTimeSlotsDto) {
    return this.appointmentsService.createSlots(dto);
  }

  @Get('operator/:operatorId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('appointments:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get operator appointments' })
  getOperatorAppointments(@Param('operatorId') operatorId: string) {
    return this.appointmentsService.getOperatorAppointments(operatorId);
  }
}