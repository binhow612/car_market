import { apiClient } from "../lib/api";

export enum NotificationType {
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  NEW_MESSAGE = 'new_message',
  LISTING_SOLD = 'listing_sold',
  NEW_INQUIRY = 'new_inquiry',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedListingId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  relatedListing?: {
    id: string;
    title: string;
    price: number;
  } | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class NotificationService {
  static async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    
    return apiClient.get<NotificationsResponse>(
      `/notifications?${params.toString()}`
    );
  }

  static async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiClient.get<{ unreadCount: number }>("/notifications/unread-count");
  }

  static async markAsRead(notificationId: string): Promise<void> {
    return apiClient.put(`/notifications/${notificationId}/read`);
  }

  static async markAllAsRead(): Promise<void> {
    return apiClient.put("/notifications/read-all");
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`/notifications/${notificationId}`);
  }
}

