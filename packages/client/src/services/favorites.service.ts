import { apiClient } from "../lib/api";

export interface FavoriteListing {
  id: string;
  title: string;
  description: string;
  price: number;
  priceType: string;
  status: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImage?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: string;
    role: "user" | "admin";
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  carDetail: {
    id: string;
    make: string;
    model: string;
    year: number;
    bodyType: string;
    fuelType: string;
    transmission: string;
    engineSize: number;
    enginePower: number;
    mileage: number;
    color: string;
    numberOfDoors: number;
    numberOfSeats: number;
    condition: string;
    vin?: string;
    registrationNumber?: string;
    previousOwners?: number;
    hasAccidentHistory: boolean;
    hasServiceHistory: boolean;
    description?: string;
    features: string[];
    images: Array<{
      id: string;
      filename: string;
      originalName: string;
      url: string;
      type: string;
      sortOrder: number;
      isPrimary: boolean;
      alt?: string;
    }>;
  };
}

export interface FavoritesResponse {
  favorites: FavoriteListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class FavoritesService {
  static async getUserFavorites(
    page: number = 1,
    limit: number = 10
  ): Promise<FavoritesResponse> {
    const response = await apiClient.get(
      `/favorites?page=${page}&limit=${limit}&_t=${Date.now()}`
    );
    return response as FavoritesResponse;
  }

  static async addToFavorites(listingId: string): Promise<void> {
    await apiClient.post(`/favorites/${listingId}`);
  }

  static async removeFromFavorites(listingId: string): Promise<void> {
    await apiClient.delete(`/favorites/${listingId}`);
  }

  static async checkIfFavorite(listingId: string): Promise<boolean> {
    const response = (await apiClient.get(`/favorites/check/${listingId}`)) as {
      isFavorite: boolean;
    };
    return response.isFavorite;
  }
}
