import {
  FuelType,
  TransmissionType,
  BodyType,
  CarCondition,
} from '../../../entities/car-detail.entity';
/**
 * Structured parameters extracted from user query for database querying
 */
export interface ListingQueryParams {
  // Car identification
  makes?: string[];
  models?: string[];
  yearMin?: number;
  yearMax?: number;

  // Car specifications
  bodyTypes?: BodyType[];
  fuelTypes?: FuelType[];
  transmissions?: TransmissionType[];
  conditions?: CarCondition[];

  // Numeric filters
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  seatsMin?: number;

  // Location
  location?: string;
  city?: string;
  state?: string;
  country?: string;

  // Features and preferences
  features?: string[];
  colors?: string[];

  // Sorting and pagination
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;

  // Special filters
  isFeatured?: boolean;
  isUrgent?: boolean;
  hasServiceHistory?: boolean;
  noAccidentHistory?: boolean;
}

/**
 * LLM extraction result with confidence and reasoning
 */
export interface ExtractedQueryParams extends ListingQueryParams {
  confidence: number;
  extractedKeywords: string[];
  inferredPreferences?: {
    budgetCategory?: 'economy' | 'mid-range' | 'luxury' | 'premium';
    useCase?: 'family' | 'commute' | 'performance' | 'off-road' | 'eco-friendly';
    urgency?: 'high' | 'medium' | 'low';
  };
}

