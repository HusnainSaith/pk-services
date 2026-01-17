import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendToRoleDto } from './dto/send-to-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Email tracking pixel endpoint - NO AUTH REQUIRED (must be before other routes)
  @Get('track/:notificationId')
  @ApiOperation({ summary: '[Public] Track email open' })
  async trackEmailOpen(
    @Param('notificationId') notificationId: string,
    @Res() res: any,
  ) {
    try {
      await this.notificationsService.markEmailAsRead(notificationId);
    } catch (error) {
      // Silently fail - don't break email rendering
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    return res.send(pixel);
  }

  // Customer Routes (with authentication)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('my')
  @Permissions('notifications:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] List my notifications' })
  findMy(@CurrentUser() user: any) {
    return this.notificationsService.findByUser(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('unread-count')
  @Permissions('notifications:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get unread count' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/read')
  @Permissions('notifications:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Mark notification as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('mark-all-read')
  @Permissions('notifications:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @Permissions('notifications:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Delete notification' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.remove(id);
  }

  // Admin Routes
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('send')
  @Permissions('notifications:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Send notification' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('broadcast')
  @Permissions('notifications:broadcast')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Broadcast to all users' })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('send-to-role')
  @Permissions('notifications:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Send to role' })
  sendToRole(@Body() dto: SendToRoleDto) {
    return this.notificationsService.sendToRole(dto);
  }
}
