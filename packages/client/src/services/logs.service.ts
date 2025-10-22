import { apiClient } from "../lib/api";

export interface LogEntry {
  id: string;
  level: "info" | "warning" | "error" | "debug";
  category: string;
  message: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  targetUserId?: string;
  listingId?: string;
  conversationId?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  targetUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LogFilters {
  level?: string;
  category?: string;
  userId?: string;
  targetUserId?: string;
  listingId?: string;
  conversationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LogStats {
  totalLogs: number;
  logsByLevel: Array<{ level: string; count: string }>;
  logsByCategory: Array<{ category: string; count: string }>;
  recentActivity: LogEntry[];
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class LogsService {
  static async getLogs(filters: LogFilters = {}): Promise<LogsResponse> {
    const response = await apiClient.get<LogsResponse>("/logs", filters);
    return response;
  }

  static async getLogStats(): Promise<LogStats> {
    const response = await apiClient.get<LogStats>("/logs/stats");
    return response;
  }

  static async getLogById(id: string): Promise<LogEntry> {
    const response = await apiClient.get<LogEntry>(`/logs/${id}`);
    return response;
  }

  static async exportLogs(filters: LogFilters = {}): Promise<Blob> {
    return apiClient.getBlob("/logs/export", filters);
  }

  static async cleanupOldLogs(
    days: number = 90
  ): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.delete<{
      message: string;
      deletedCount: number;
    }>("/logs/cleanup", {
      params: { days },
    });
    return response;
  }
}
