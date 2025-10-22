import { apiClient } from "../lib/api";
import type { CarMake, CarModel, CarMetadata } from "./metadata.service";

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  totalTransactions: number;
  recentUsers?: number;
  recentListings?: number;
  activeListings?: number;
}

export interface AdminMetadata {
  makes: CarMake[];
  models: CarModel[];
  metadata: CarMetadata[];
}

export interface CreateMakeData {
  name: string;
  displayName?: string;
  logoUrl?: string;
}

export interface UpdateMakeData {
  name?: string;
  displayName?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface CreateModelData {
  makeId: string;
  name: string;
  displayName?: string;
}

export interface UpdateModelData {
  name?: string;
  displayName?: string;
  isActive?: boolean;
}

export interface CreateMetadataData {
  type: string;
  value: string;
  displayValue?: string;
  description?: string;
}

export interface UpdateMetadataData {
  value?: string;
  displayValue?: string;
  description?: string;
  isActive?: boolean;
}

export class AdminService {
  // Dashboard
  static async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/admin/dashboard/stats");
  }

  static async getAllMetadataForAdmin(): Promise<AdminMetadata> {
    return apiClient.get<AdminMetadata>("/metadata/admin/all");
  }

  // Car Makes Management
  static async createMake(data: CreateMakeData): Promise<CarMake> {
    return apiClient.post<CarMake>("/metadata/makes", data);
  }

  static async updateMake(id: string, data: UpdateMakeData): Promise<CarMake> {
    return apiClient.put<CarMake>(`/metadata/makes/${id}`, data);
  }

  static async deleteMake(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/metadata/makes/${id}`);
  }

  // Car Models Management
  static async createModel(data: CreateModelData): Promise<CarModel> {
    return apiClient.post<CarModel>("/metadata/models", data);
  }

  static async updateModel(
    id: string,
    data: UpdateModelData
  ): Promise<CarModel> {
    return apiClient.put<CarModel>(`/metadata/models/${id}`, data);
  }

  static async deleteModel(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/metadata/models/${id}`);
  }

  // Metadata Management
  static async createMetadata(data: CreateMetadataData): Promise<CarMetadata> {
    return apiClient.post<CarMetadata>("/metadata/metadata", data);
  }

  static async updateMetadata(
    id: string,
    data: UpdateMetadataData
  ): Promise<CarMetadata> {
    return apiClient.put<CarMetadata>(`/metadata/metadata/${id}`, data);
  }

  static async deleteMetadata(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/metadata/metadata/${id}`);
  }

  // Utility
  static async seedInitialData(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/metadata/seed");
  }

  // User Management
  static async getAllUsers(page: number = 1, limit: number = 10) {
    return apiClient.get("/admin/users", { page, limit });
  }

  // Listing Management
  static async getPendingListings(page: number = 1, limit: number = 10) {
    return apiClient.get("/admin/listings/pending", { page, limit });
  }

  static async approveListing(id: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/admin/listings/${id}/approve`);
  }

  static async rejectListing(
    id: string,
    reason?: string
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/admin/listings/${id}/reject`, {
      reason,
    });
  }

  // Enhanced listing management
  static async getAllListings(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ): Promise<{
    listings: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append("status", status);
    if (search) params.append("search", search);

    return apiClient.get(`/admin/listings?${params.toString()}`);
  }

  static async getListingById(id: string): Promise<any> {
    return apiClient.get(`/admin/listings/${id}`);
  }

  static async updateListingStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<{ message: string }> {
    return apiClient.put(`/admin/listings/${id}/status`, {
      status,
      reason,
    });
  }

  static async deleteListing(
    id: string,
    reason?: string
  ): Promise<{ message: string }> {
    return apiClient.delete(`/admin/listings/${id}`, {
      data: { reason },
    });
  }

  static async toggleFeatured(id: string): Promise<{ message: string }> {
    return apiClient.put(`/admin/listings/${id}/featured`);
  }

  // Enhanced user management
  static async getUserById(id: string): Promise<any> {
    return apiClient.get(`/admin/users/${id}`);
  }

  static async updateUserStatus(
    id: string,
    isActive: boolean,
    reason?: string
  ): Promise<{ message: string }> {
    return apiClient.put(`/admin/users/${id}/status`, {
      isActive,
      reason,
    });
  }

  static async updateUserRole(
    id: string,
    role: string
  ): Promise<{ message: string }> {
    return apiClient.put(`/admin/users/${id}/role`, {
      role,
    });
  }

  static async getUserListings(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    listings: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return apiClient.get(
      `/admin/users/${userId}/listings?${params.toString()}`
    );
  }

  // Analytics and reports
  static async getAnalyticsOverview(): Promise<any> {
    return apiClient.get("/admin/analytics/overview");
  }

  static async getListingAnalytics(period: string = "30d"): Promise<any> {
    return apiClient.get(`/admin/analytics/listings?period=${period}`);
  }

  static async getUserAnalytics(period: string = "30d"): Promise<any> {
    return apiClient.get(`/admin/analytics/users?period=${period}`);
  }

  static async getListingWithPendingChanges(listingId: string): Promise<any> {
    const response = await apiClient.get(
      `/admin/listings/${listingId}/pending-changes`
    );
    return response;
  }
}
