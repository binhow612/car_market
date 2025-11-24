import { Injectable, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../../entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Optional() @Inject(NotificationsGateway)
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedListingId?: string | null,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      relatedListingId: relatedListingId || null,
      metadata: metadata || null,
      isRead: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Load relations for real-time emit
    const notificationWithRelations = await this.notificationRepository.findOne({
      where: { id: savedNotification.id },
      relations: ['relatedListing'],
    });

    // Send real-time notification
    if (notificationWithRelations && this.notificationsGateway) {
      this.notificationsGateway.sendNotificationToUser(
        userId,
        notificationWithRelations,
      );

      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCountUpdateToUser(userId, unreadCount);
    }

    return savedNotification;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .leftJoinAndSelect('notification.relatedListing', 'listing')
      .orderBy('notification.createdAt', 'DESC');

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const [notifications, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.notificationRepository.update(notificationId, {
      isRead: true,
    });

    // Send real-time update
    if (this.notificationsGateway) {
      this.notificationsGateway.sendNotificationUpdateToUser(userId, {
        type: 'read',
        notificationId,
      });

      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCountUpdateToUser(userId, unreadCount);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    // Update unread count
    if (this.notificationsGateway) {
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCountUpdateToUser(userId, unreadCount);
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Notification not found');
    }

    // Send real-time update
    if (this.notificationsGateway) {
      this.notificationsGateway.sendNotificationUpdateToUser(userId, {
        type: 'deleted',
        notificationId,
      });

      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCountUpdateToUser(userId, unreadCount);
    }
  }
}

