/**
 * DTOs for car comparison feature
 * Provides structured data for side-by-side car comparisons
 */

export interface CarComparisonSpec {
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
  features: string[];
  hasAccidentHistory: boolean;
  hasServiceHistory: boolean;
  previousOwners: number | null;
}

export interface CarInventoryItem {
  listingId: string;
  carDetailId: string;
  price: number;
  location: string | null;
  city: string | null;
  status: string;
  sellerId: string;
  sellerName: string;
  postedDate: Date;
  specs: CarComparisonSpec;
  images: string[];
}

export interface ComparisonCategory {
  category: string;
  attributes: ComparisonAttribute[];
}

export interface ComparisonAttribute {
  name: string;
  car1Value: string | number | boolean | null;
  car2Value: string | number | boolean | null;
  winner?: 'car1' | 'car2' | 'tie';
  icon?: string;
}

export interface ComparisonSummary {
  overallWinner: string | null;
  car1Advantages: string[];
  car2Advantages: string[];
  similarities: string[];
}

export interface CarComparisonData {
  car1: CarInventoryItem | null;
  car2: CarInventoryItem | null;
  comparisonTable: ComparisonCategory[];
  summary: ComparisonSummary;
  foundInInventory: boolean;
  inventoryCount: {
    car1Count: number;
    car2Count: number;
  };
}

export interface ComparisonQueryResult {
  car1Query: {
    make: string | null;
    model: string | null;
  };
  car2Query: {
    make: string | null;
    model: string | null;
  };
  extractedSuccessfully: boolean;
}

