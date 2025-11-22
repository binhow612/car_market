import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  getUserNotifications(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('unreadOnly') unreadOnly: string = 'false',
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Put(':id/read')
  markAsRead(
    @CurrentUser() user: User,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  @Put('read-all')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  deleteNotification(
    @CurrentUser() user: User,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(notificationId, user.id);
  }
}

