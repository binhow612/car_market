import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ListingDetail, ListingStatus } from '../../../entities/listing-detail.entity';
import {
  CarComparisonData,
  CarInventoryItem,
  ComparisonCategory,
  ComparisonSummary,
  ComparisonQueryResult,
} from '../dto/car-comparison.dto';

/**
 * Service responsible for car comparison logic
 * Handles entity extraction, inventory matching, and comparison data generation
 */
@Injectable()
export class CarComparisonService {
  private readonly logger = new Logger(CarComparisonService.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  /**
   * Extract car entities from user query using LLM
   * More accurate than regex-based extraction
   */
  async extractCarEntities(userQuery: string): Promise<ComparisonQueryResult> {
    try {
      const systemPrompt = `You are a car entity extraction system.
Extract exactly TWO cars from the user's comparison query.

Rules:
1. Return both make AND model for each car if available
2. If only make is mentioned, model should be null
3. Normalize car names (e.g., "civic" -> "Civic", "BMW" -> "BMW")
4. Handle common abbreviations (e.g., "CRV" -> "CR-V", "X5" -> "X5")

Respond in JSON format:
{
  "car1": {
    "make": "Make1",
    "model": "Model1"
  },
  "car2": {
    "make": "Make2",
    "model": "Model2"
  }
}

Examples:
- "Compare Honda Civic vs Toyota Corolla" -> {car1: {make: "Honda", model: "Civic"}, car2: {make: "Toyota", model: "Corolla"}}
- "Mazda CX5 or Honda CRV" -> {car1: {make: "Mazda", model: "CX-5"}, car2: {make: "Honda", model: "CR-V"}}
- "BMW X5 versus Mercedes GLE" -> {car1: {make: "BMW", model: "X5"}, car2: {make: "Mercedes", model: "GLE"}}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(
        completion.choices[0]?.message?.content || '{}',
      );

      this.logger.log(
        `Extracted entities: Car1=${result.car1?.make} ${result.car1?.model}, Car2=${result.car2?.make} ${result.car2?.model}`,
      );

      return {
        car1Query: {
          make: result.car1?.make || null,
          model: result.car1?.model || null,
        },
        car2Query: {
          make: result.car2?.make || null,
          model: result.car2?.model || null,
        },
        extractedSuccessfully:
          !!(result.car1?.make && result.car2?.make),
      };
    } catch (error) {
      this.logger.error('Error extracting car entities:', error);
      return {
        car1Query: { make: null, model: null },
        car2Query: { make: null, model: null },
        extractedSuccessfully: false,
      };
    }
  }

  /**
   * Find matching cars in inventory
   */
  async findCarsInInventory(
    car1Query: { make: string | null; model: string | null },
    car2Query: { make: string | null; model: string | null },
  ): Promise<{
    car1Matches: ListingDetail[];
    car2Matches: ListingDetail[];
  }> {
    try {
      const allListings = await this.listingRepository.find({
        where: { status: ListingStatus.APPROVED },
        relations: ['carDetail', 'carDetail.images', 'seller'],
        order: { createdAt: 'DESC' },
        take: 200,
      });

      // Find car 1 matches
      const car1Matches = allListings.filter((listing) => {
        if (!listing.carDetail) return false;
        const makeMatch = car1Query.make
          ? listing.carDetail.make.toLowerCase() ===
            car1Query.make.toLowerCase()
          : true;
        const modelMatch = car1Query.model
          ? listing.carDetail.model.toLowerCase() ===
            car1Query.model.toLowerCase()
          : true;
        return makeMatch && modelMatch;
      });

      // Find car 2 matches
      const car2Matches = allListings.filter((listing) => {
        if (!listing.carDetail) return false;
        const makeMatch = car2Query.make
          ? listing.carDetail.make.toLowerCase() ===
            car2Query.make.toLowerCase()
          : true;
        const modelMatch = car2Query.model
          ? listing.carDetail.model.toLowerCase() ===
            car2Query.model.toLowerCase()
          : true;
        return makeMatch && modelMatch;
      });

      this.logger.log(
        `Found ${car1Matches.length} matches for ${car1Query.make} ${car1Query.model}, ` +
          `${car2Matches.length} matches for ${car2Query.make} ${car2Query.model}`,
      );

      return { car1Matches, car2Matches };
    } catch (error) {
      this.logger.error('Error finding cars in inventory:', error);
      return { car1Matches: [], car2Matches: [] };
    }
  }

  /**
   * Convert listing to inventory item
   */
  private convertToInventoryItem(
    listing: ListingDetail,
  ): CarInventoryItem | null {
    if (!listing.carDetail) return null;

    const car = listing.carDetail;

    return {
      listingId: listing.id,
      carDetailId: car.id,
      price: Number(listing.price),
      location: listing.location,
      city: listing.city,
      status: listing.status,
      sellerId: listing.seller.id,
      sellerName: `${listing.seller.firstName} ${listing.seller.lastName}`,
      postedDate: listing.createdAt,
      images: car.images?.map((img) => img.url) || [],
      specs: {
        make: car.make,
        model: car.model,
        year: car.year,
        bodyType: car.bodyType,
        fuelType: car.fuelType,
        transmission: car.transmission,
        engineSize: Number(car.engineSize),
        enginePower: car.enginePower,
        mileage: car.mileage,
        color: car.color,
        numberOfDoors: car.numberOfDoors,
        numberOfSeats: car.numberOfSeats,
        condition: car.condition,
        features: car.features || [],
        hasAccidentHistory: car.hasAccidentHistory,
        hasServiceHistory: car.hasServiceHistory,
        previousOwners: car.previousOwners,
      },
    };
  }

  /**
   * Build side-by-side comparison table
   */
  buildComparisonTable(
    car1: CarInventoryItem | null,
    car2: CarInventoryItem | null,
  ): ComparisonCategory[] {
    if (!car1 || !car2) return [];

    const categories: ComparisonCategory[] = [
      {
        category: 'Basic Information',
        attributes: [
          {
            name: 'Make & Model',
            car1Value: `${car1.specs.make} ${car1.specs.model}`,
            car2Value: `${car2.specs.make} ${car2.specs.model}`,
            icon: '🚗',
          },
          {
            name: 'Year',
            car1Value: car1.specs.year,
            car2Value: car2.specs.year,
            winner: this.determineYearWinner(car1.specs.year, car2.specs.year),
            icon: '📅',
          },
          {
            name: 'Condition',
            car1Value: car1.specs.condition,
            car2Value: car2.specs.condition,
            icon: '⭐',
          },
          {
            name: 'Price',
            car1Value: `$${car1.price.toLocaleString()}`,
            car2Value: `$${car2.price.toLocaleString()}`,
            winner: this.determinePriceWinner(car1.price, car2.price),
            icon: '💰',
          },
        ],
      },
      {
        category: 'Performance',
        attributes: [
          {
            name: 'Engine Size',
            car1Value: `${car1.specs.engineSize}L`,
            car2Value: `${car2.specs.engineSize}L`,
            winner: this.determineEngineWinner(
              car1.specs.engineSize,
              car2.specs.engineSize,
            ),
            icon: '🔧',
          },
          {
            name: 'Horsepower',
            car1Value: `${car1.specs.enginePower} HP`,
            car2Value: `${car2.specs.enginePower} HP`,
            winner: this.determinePowerWinner(
              car1.specs.enginePower,
              car2.specs.enginePower,
            ),
            icon: '⚡',
          },
          {
            name: 'Fuel Type',
            car1Value: car1.specs.fuelType,
            car2Value: car2.specs.fuelType,
            icon: '⛽',
          },
          {
            name: 'Transmission',
            car1Value: car1.specs.transmission,
            car2Value: car2.specs.transmission,
            icon: '⚙️',
          },
        ],
      },
      {
        category: 'Specifications',
        attributes: [
          {
            name: 'Body Type',
            car1Value: car1.specs.bodyType,
            car2Value: car2.specs.bodyType,
            icon: '🚙',
          },
          {
            name: 'Doors',
            car1Value: car1.specs.numberOfDoors,
            car2Value: car2.specs.numberOfDoors,
            icon: '🚪',
          },
          {
            name: 'Seats',
            car1Value: car1.specs.numberOfSeats,
            car2Value: car2.specs.numberOfSeats,
            winner: this.determineSeatsWinner(
              car1.specs.numberOfSeats,
              car2.specs.numberOfSeats,
            ),
            icon: '💺',
          },
          {
            name: 'Color',
            car1Value: car1.specs.color,
            car2Value: car2.specs.color,
            icon: '🎨',
          },
        ],
      },
      {
        category: 'History & Condition',
        attributes: [
          {
            name: 'Mileage',
            car1Value: `${car1.specs.mileage.toLocaleString()} km`,
            car2Value: `${car2.specs.mileage.toLocaleString()} km`,
            winner: this.determineMileageWinner(
              car1.specs.mileage,
              car2.specs.mileage,
            ) || 'tie',
            icon: '📊',
          },
          {
            name: 'Previous Owners',
            car1Value: car1.specs.previousOwners ?? 'Unknown',
            car2Value: car2.specs.previousOwners ?? 'Unknown',
            winner: this.determineOwnersWinner(
              car1.specs.previousOwners,
              car2.specs.previousOwners,
            ) || 'tie',
            icon: '👥',
          },
          {
            name: 'Service History',
            car1Value: car1.specs.hasServiceHistory ? 'Yes' : 'No',
            car2Value: car2.specs.hasServiceHistory ? 'Yes' : 'No',
            winner: this.determineBooleanWinner(
              car1.specs.hasServiceHistory,
              car2.specs.hasServiceHistory,
            ) || 'tie',
            icon: '🔧',
          },
          {
            name: 'Accident History',
            car1Value: car1.specs.hasAccidentHistory ? 'Yes' : 'No',
            car2Value: car2.specs.hasAccidentHistory ? 'Yes' : 'No',
            winner: this.determineAccidentWinner(
              car1.specs.hasAccidentHistory,
              car2.specs.hasAccidentHistory,
            ) || 'tie',
            icon: '⚠️',
          },
        ],
      },
      {
        category: 'Features',
        attributes: [
          {
            name: 'Number of Features',
            car1Value: car1.specs.features.length,
            car2Value: car2.specs.features.length,
            winner: this.determineFeaturesCountWinner(
              car1.specs.features.length,
              car2.specs.features.length,
            ),
            icon: '✨',
          },
          {
            name: 'Feature List',
            car1Value: car1.specs.features.join(', ') || 'None listed',
            car2Value: car2.specs.features.join(', ') || 'None listed',
            icon: '📋',
          },
        ],
      },
    ];

    return categories;
  }

  /**
   * Generate comparison summary using LLM
   */
  async generateComparisonSummary(
    car1: CarInventoryItem | null,
    car2: CarInventoryItem | null,
    _comparisonTable: ComparisonCategory[],
  ): Promise<ComparisonSummary> {
    if (!car1 || !car2) {
      return {
        overallWinner: null,
        car1Advantages: [],
        car2Advantages: [],
        similarities: [],
      };
    }

    try {
      const systemPrompt = `You are a car comparison analyst.
Based on the comparison data, generate a concise summary.

Respond in JSON format:
{
  "overallWinner": "Car1 Name" or "Car2 Name" or null (if tied),
  "car1Advantages": ["advantage 1", "advantage 2", ...],
  "car2Advantages": ["advantage 1", "advantage 2", ...],
  "similarities": ["similarity 1", "similarity 2", ...]
}

Focus on:
- Price value
- Lower mileage
- Better condition
- More features
- Better performance
- Newer year
- Better history (service, no accidents)

Keep advantages concise (4-8 words each).`;

      const comparisonData = {
        car1: {
          name: `${car1.specs.year} ${car1.specs.make} ${car1.specs.model}`,
          price: car1.price,
          year: car1.specs.year,
          mileage: car1.specs.mileage,
          condition: car1.specs.condition,
          enginePower: car1.specs.enginePower,
          features: car1.specs.features.length,
          hasServiceHistory: car1.specs.hasServiceHistory,
          hasAccidentHistory: car1.specs.hasAccidentHistory,
        },
        car2: {
          name: `${car2.specs.year} ${car2.specs.make} ${car2.specs.model}`,
          price: car2.price,
          year: car2.specs.year,
          mileage: car2.specs.mileage,
          condition: car2.specs.condition,
          enginePower: car2.specs.enginePower,
          features: car2.specs.features.length,
          hasServiceHistory: car2.specs.hasServiceHistory,
          hasAccidentHistory: car2.specs.hasAccidentHistory,
        },
      };

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Compare these cars:\n${JSON.stringify(comparisonData, null, 2)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(
        completion.choices[0]?.message?.content || '{}',
      );

      return {
        overallWinner: result.overallWinner || null,
        car1Advantages: result.car1Advantages || [],
        car2Advantages: result.car2Advantages || [],
        similarities: result.similarities || [],
      };
    } catch (error) {
      this.logger.error('Error generating comparison summary:', error);
      return this.generateFallbackSummary(car1, car2);
    }
  }

  /**
   * Fallback summary without LLM
   */
  private generateFallbackSummary(
    car1: CarInventoryItem,
    car2: CarInventoryItem,
  ): ComparisonSummary {
    const car1Advantages: string[] = [];
    const car2Advantages: string[] = [];
    const similarities: string[] = [];

    // Price comparison
    if (car1.price < car2.price) {
      car1Advantages.push(`Lower price ($${car1.price.toLocaleString()})`);
    } else if (car2.price < car1.price) {
      car2Advantages.push(`Lower price ($${car2.price.toLocaleString()})`);
    } else {
      similarities.push('Same price range');
    }

    // Mileage comparison
    if (car1.specs.mileage < car2.specs.mileage) {
      car1Advantages.push('Lower mileage');
    } else if (car2.specs.mileage < car1.specs.mileage) {
      car2Advantages.push('Lower mileage');
    }

    // Year comparison
    if (car1.specs.year > car2.specs.year) {
      car1Advantages.push('Newer model year');
    } else if (car2.specs.year > car1.specs.year) {
      car2Advantages.push('Newer model year');
    } else {
      similarities.push('Same model year');
    }

    // Features comparison
    if (car1.specs.features.length > car2.specs.features.length) {
      car1Advantages.push('More features');
    } else if (car2.specs.features.length > car1.specs.features.length) {
      car2Advantages.push('More features');
    }

    // Service history
    if (car1.specs.hasServiceHistory && !car2.specs.hasServiceHistory) {
      car1Advantages.push('Has service history');
    } else if (car2.specs.hasServiceHistory && !car1.specs.hasServiceHistory) {
      car2Advantages.push('Has service history');
    } else if (car1.specs.hasServiceHistory && car2.specs.hasServiceHistory) {
      similarities.push('Both have service history');
    }

    // Accident history
    if (!car1.specs.hasAccidentHistory && car2.specs.hasAccidentHistory) {
      car1Advantages.push('No accident history');
    } else if (
      !car2.specs.hasAccidentHistory &&
      car1.specs.hasAccidentHistory
    ) {
      car2Advantages.push('No accident history');
    } else if (
      !car1.specs.hasAccidentHistory &&
      !car2.specs.hasAccidentHistory
    ) {
      similarities.push('Clean accident history');
    }

    // Body type
    if (car1.specs.bodyType === car2.specs.bodyType) {
      similarities.push(`Both are ${car1.specs.bodyType}s`);
    }

    return {
      overallWinner:
        car1Advantages.length > car2Advantages.length
          ? `${car1.specs.year} ${car1.specs.make} ${car1.specs.model}`
          : car2Advantages.length > car1Advantages.length
            ? `${car2.specs.year} ${car2.specs.make} ${car2.specs.model}`
            : null,
      car1Advantages,
      car2Advantages,
      similarities,
    };
  }

  // Helper methods for determining winners
  private determineYearWinner(
    year1: number,
    year2: number,
  ): 'car1' | 'car2' | 'tie' {
    if (year1 > year2) return 'car1';
    if (year2 > year1) return 'car2';
    return 'tie';
  }

  private determinePriceWinner(
    price1: number,
    price2: number,
  ): 'car1' | 'car2' | 'tie' {
    // Lower price wins
    if (price1 < price2) return 'car1';
    if (price2 < price1) return 'car2';
    return 'tie';
  }

  private determineEngineWinner(
    engine1: number,
    engine2: number,
  ): 'car1' | 'car2' | 'tie' {
    if (engine1 > engine2) return 'car1';
    if (engine2 > engine1) return 'car2';
    return 'tie';
  }

  private determinePowerWinner(
    power1: number,
    power2: number,
  ): 'car1' | 'car2' | 'tie' {
    if (power1 > power2) return 'car1';
    if (power2 > power1) return 'car2';
    return 'tie';
  }

  private determineSeatsWinner(
    seats1: number,
    seats2: number,
  ): 'car1' | 'car2' | 'tie' {
    if (seats1 > seats2) return 'car1';
    if (seats2 > seats1) return 'car2';
    return 'tie';
  }

  private determineMileageWinner(
    mileage1: number,
    mileage2: number,
  ): 'car1' | 'car2' | 'tie' {
    // Lower mileage wins
    if (mileage1 < mileage2) return 'car1';
    if (mileage2 < mileage1) return 'car2';
    return 'tie';
  }

  private determineOwnersWinner(
    owners1: number | null,
    owners2: number | null,
  ): 'car1' | 'car2' | 'tie' | undefined {
    if (owners1 === null || owners2 === null) return undefined;
    // Fewer owners wins
    if (owners1 < owners2) return 'car1';
    if (owners2 < owners1) return 'car2';
    return 'tie';
  }

  private determineBooleanWinner(
    bool1: boolean,
    bool2: boolean,
  ): 'car1' | 'car2' | 'tie' | undefined {
    if (bool1 && !bool2) return 'car1';
    if (bool2 && !bool1) return 'car2';
    if (bool1 && bool2) return 'tie';
    return undefined;
  }

  private determineAccidentWinner(
    hasAccident1: boolean,
    hasAccident2: boolean,
  ): 'car1' | 'car2' | 'tie' | undefined {
    // No accident wins
    if (!hasAccident1 && hasAccident2) return 'car1';
    if (!hasAccident2 && hasAccident1) return 'car2';
    if (!hasAccident1 && !hasAccident2) return 'tie';
    return undefined;
  }

  private determineFeaturesCountWinner(
    count1: number,
    count2: number,
  ): 'car1' | 'car2' | 'tie' {
    if (count1 > count2) return 'car1';
    if (count2 > count1) return 'car2';
    return 'tie';
  }

  /**
   * Main comparison orchestration method
   */
  async compareCars(userQuery: string): Promise<CarComparisonData> {
    // Step 1: Extract car entities
    const entities = await this.extractCarEntities(userQuery);

    if (!entities.extractedSuccessfully) {
      return {
        car1: null,
        car2: null,
        comparisonTable: [],
        summary: {
          overallWinner: null,
          car1Advantages: [],
          car2Advantages: [],
          similarities: [],
        },
        foundInInventory: false,
        inventoryCount: { car1Count: 0, car2Count: 0 },
      };
    }

    // Step 2: Find cars in inventory
    const { car1Matches, car2Matches } = await this.findCarsInInventory(
      entities.car1Query,
      entities.car2Query,
    );

    // Step 3: Select best match for each car (most recent, best condition)
    const car1 = car1Matches.length > 0 && car1Matches[0]
      ? this.convertToInventoryItem(car1Matches[0])!
      : null;

    const car2 = car2Matches.length > 0 && car2Matches[0]
      ? this.convertToInventoryItem(car2Matches[0])!
      : null;

    // Step 4: Build comparison table
    const comparisonTable = this.buildComparisonTable(car1, car2);

    // Step 5: Generate summary
    const summary = await this.generateComparisonSummary(
      car1,
      car2,
      comparisonTable,
    );

    return {
      car1,
      car2,
      comparisonTable,
      summary,
      foundInInventory: !!(car1 && car2),
      inventoryCount: {
        car1Count: car1Matches.length,
        car2Count: car2Matches.length,
      },
    };
  }
}

