import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ExtractedQueryParams } from '../dto/listing-query-params.dto';

/**
 * Advanced query parameter extraction service using LLM
 * Extracts structured database query parameters from natural language
 */
@Injectable()
export class QueryExtractionService {
  private readonly logger = new Logger(QueryExtractionService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  /**
   * Extract structured query parameters from natural language using LLM
   */
  async extractQueryParameters(
    userQuery: string,
  ): Promise<ExtractedQueryParams> {
    try {
      const systemPrompt = this.buildExtractionPrompt();
      const userPrompt = this.buildUserPrompt(userQuery);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for consistent extraction
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      const extracted = JSON.parse(responseContent);
      
      // Validate and normalize the extracted data
      const normalized = this.normalizeExtractedData(extracted);

      this.logger.log(
        `Extracted query params: ${JSON.stringify(normalized, null, 2)}`,
      );

      return normalized;
    } catch (error) {
      this.logger.error('Error extracting query parameters:', error);
      // Return minimal params with low confidence
      return {
        confidence: 0.3,
        extractedKeywords: [],
        limit: 10,
      };
    }
  }

  /**
   * Build comprehensive system prompt for extraction
   */
  private buildExtractionPrompt(): string {
    return `You are an expert data extraction system for a car marketplace.
Extract structured query parameters from user queries about available cars.

**Available Fields:**

1. **Car Identification:**
   - makes: array of car manufacturers (e.g., ["Honda", "Toyota", "BMW"])
   - models: array of car models (e.g., ["Civic", "Corolla"])
   - yearMin, yearMax: integer year range (e.g., 2018-2023)

2. **Body Types:** (extract as array)
   - sedan, hatchback, suv, coupe, convertible, wagon, pickup, van, minivan

3. **Fuel Types:** (extract as array)
   - petrol, diesel, electric, hybrid, lpg, cng

4. **Transmission:** (extract as array)
   - manual, automatic, cvt, semi_automatic

5. **Condition:** (extract as array)
   - excellent, very_good, good, fair, poor

6. **Numeric Filters:**
   - priceMin, priceMax: numbers in USD
   - mileageMax: maximum mileage in miles
   - seatsMin: minimum number of seats

7. **Location:**
   - location, city, state, country: string values

8. **Features:** (extract as array)
   - Common: GPS, leather seats, sunroof, bluetooth, backup camera, adaptive cruise control, lane assist, etc.

9. **Colors:** (extract as array if specified)
   - red, blue, black, white, silver, gray, etc.

10. **Sorting:**
    - sortBy: price | year | mileage | createdAt
    - sortOrder: ASC | DESC

11. **Special Filters:**
    - isFeatured, isUrgent: boolean
    - hasServiceHistory: boolean (if user mentions service/maintenance history)
    - noAccidentHistory: boolean (if user wants clean history)

**Extraction Rules:**

1. Be intelligent about implicit requests (but ONLY when explicitly mentioned):
   - "cheap cars" → priceMax: 15000
   - "new cars" OR "recent cars" OR "latest models" → yearMin: current year - 2
   - "low mileage" → mileageMax: 50000
   - "family car" → seatsMin: 5, bodyTypes: ["suv", "minivan", "wagon"]
   - "fuel efficient" → fuelTypes: ["hybrid", "electric"]
   - "luxury" → priceMin: 40000, budgetCategory: "luxury"
   - **DO NOT infer year filters unless explicitly mentioned (new/recent/old/vintage)**

2. Handle ranges naturally:
   - "under $30k" → priceMax: 30000
   - "between $20k and $40k" → priceMin: 20000, priceMax: 40000
   - "2018 to 2022" → yearMin: 2018, yearMax: 2022
   - "less than 50k miles" → mileageMax: 50000

3. Normalize values:
   - Standardize car makes (e.g., "honda" → "Honda", "bmw" → "BMW")
   - Convert "k" notation (e.g., "30k" → 30000)
   - Map synonyms (e.g., "auto" → "automatic", "gas" → "petrol")

4. Infer preferences (only when context is clear):
   - budgetCategory: economy (<$20k), mid-range ($20k-$40k), luxury ($40k-$70k), premium (>$70k)
   - useCase: family, commute, performance, off-road, eco-friendly

5. Set sensible defaults:
   - limit: 10 (unless user specifies)
   - sortBy: "price" or "createdAt"
   - confidence: 0.0-1.0 based on clarity of request

6. **IMPORTANT - Avoid over-filtering:**
   - If user asks "any X available?" or "do you have X?", extract ONLY the explicitly mentioned criteria
   - Do NOT add yearMin/yearMax unless user says "new", "recent", "old", "vintage", or specifies a year
   - Do NOT add price filters unless user mentions budget/price
   - Keep queries broad unless user provides specific constraints

**Output Format (JSON):**
{
  "makes": ["Honda", "Toyota"],
  "models": ["Civic"],
  "yearMin": 2018,
  "yearMax": 2023,
  "bodyTypes": ["sedan", "hatchback"],
  "fuelTypes": ["hybrid", "electric"],
  "transmissions": ["automatic"],
  "conditions": ["excellent", "very_good"],
  "priceMin": 15000,
  "priceMax": 30000,
  "mileageMax": 50000,
  "seatsMin": 5,
  "location": "California",
  "city": "Los Angeles",
  "features": ["GPS", "bluetooth"],
  "colors": ["black", "white"],
  "sortBy": "price",
  "sortOrder": "ASC",
  "limit": 10,
  "hasServiceHistory": true,
  "noAccidentHistory": true,
  "confidence": 0.9,
  "extractedKeywords": ["Honda", "Civic", "hybrid", "under $30k"],
  "inferredPreferences": {
    "budgetCategory": "mid-range",
    "useCase": "commute",
    "urgency": "medium"
  }
}

Only include fields that are mentioned or strongly implied. Return valid JSON.`;
  }

  /**
   * Build user-specific prompt with query
   */
  private buildUserPrompt(userQuery: string): string {
    const currentYear = new Date().getFullYear();
    return `Current year: ${currentYear}

User query: "${userQuery}"

Extract all relevant query parameters from this request. Be intelligent about implicit requirements.`;
  }

  /**
   * Normalize and validate extracted data
   */
  private normalizeExtractedData(extracted: any): ExtractedQueryParams {
    const normalized: ExtractedQueryParams = {
      confidence: extracted.confidence || 0.7,
      extractedKeywords: extracted.extractedKeywords || [],
      limit: extracted.limit || 10,
    };

    // Car identification
    if (extracted.makes?.length > 0) {
      normalized.makes = extracted.makes.map((m: string) =>
        this.normalizeMake(m),
      );
    }

    if (extracted.models?.length > 0) {
      normalized.models = extracted.models.map((m: string) =>
        this.capitalizeFirst(m),
      );
    }

    // Year range validation
    if (extracted.yearMin) {
      normalized.yearMin = Math.max(1900, Math.min(extracted.yearMin, 2030));
    }
    if (extracted.yearMax) {
      normalized.yearMax = Math.max(1900, Math.min(extracted.yearMax, 2030));
    }

    // Enums - validate against actual enum values
    if (extracted.bodyTypes?.length > 0) {
      normalized.bodyTypes = extracted.bodyTypes.filter((bt: string) =>
        this.isValidBodyType(bt),
      );
    }

    if (extracted.fuelTypes?.length > 0) {
      normalized.fuelTypes = extracted.fuelTypes.filter((ft: string) =>
        this.isValidFuelType(ft),
      );
    }

    if (extracted.transmissions?.length > 0) {
      normalized.transmissions = extracted.transmissions.filter((t: string) =>
        this.isValidTransmission(t),
      );
    }

    if (extracted.conditions?.length > 0) {
      normalized.conditions = extracted.conditions;
    }

    // Numeric filters
    if (extracted.priceMin !== undefined) {
      normalized.priceMin = Math.max(0, extracted.priceMin);
    }
    if (extracted.priceMax !== undefined) {
      normalized.priceMax = Math.max(0, extracted.priceMax);
    }
    if (extracted.mileageMax !== undefined) {
      normalized.mileageMax = Math.max(0, extracted.mileageMax);
    }
    if (extracted.seatsMin !== undefined) {
      normalized.seatsMin = Math.max(2, Math.min(extracted.seatsMin, 12));
    }

    // Location
    if (extracted.location) normalized.location = extracted.location;
    if (extracted.city) normalized.city = extracted.city;
    if (extracted.state) normalized.state = extracted.state;
    if (extracted.country) normalized.country = extracted.country;

    // Features and colors
    if (extracted.features?.length > 0) {
      normalized.features = extracted.features;
    }
    if (extracted.colors?.length > 0) {
      normalized.colors = extracted.colors.map((c: string) => c.toLowerCase());
    }

    // Sorting
    if (extracted.sortBy) {
      normalized.sortBy = extracted.sortBy;
    }
    if (extracted.sortOrder) {
      normalized.sortOrder = extracted.sortOrder;
    }

    // Boolean filters
    if (extracted.isFeatured !== undefined) {
      normalized.isFeatured = extracted.isFeatured;
    }
    if (extracted.isUrgent !== undefined) {
      normalized.isUrgent = extracted.isUrgent;
    }
    if (extracted.hasServiceHistory !== undefined) {
      normalized.hasServiceHistory = extracted.hasServiceHistory;
    }
    if (extracted.noAccidentHistory !== undefined) {
      normalized.noAccidentHistory = extracted.noAccidentHistory;
    }

    // Inferred preferences
    if (extracted.inferredPreferences) {
      normalized.inferredPreferences = extracted.inferredPreferences;
    }

    return normalized;
  }

  /**
   * Normalize car make names (handle common variations)
   */
  private normalizeMake(make: string): string {
    const makeMap: Record<string, string> = {
      bmw: 'BMW',
      vw: 'Volkswagen',
      'mercedes-benz': 'Mercedes-Benz',
      mercedes: 'Mercedes-Benz',
      chevy: 'Chevrolet',
    };

    const lower = make.toLowerCase();
    return makeMap[lower] || this.capitalizeFirst(make);
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Validate body type against enum
   */
  private isValidBodyType(type: string): boolean {
    const validTypes = [
      'sedan',
      'hatchback',
      'suv',
      'coupe',
      'convertible',
      'wagon',
      'pickup',
      'van',
      'minivan',
    ];
    return validTypes.includes(type.toLowerCase());
  }

  /**
   * Validate fuel type against enum
   */
  private isValidFuelType(type: string): boolean {
    const validTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng'];
    return validTypes.includes(type.toLowerCase());
  }

  /**
   * Validate transmission against enum
   */
  private isValidTransmission(type: string): boolean {
    const validTypes = ['manual', 'automatic', 'cvt', 'semi_automatic'];
    return validTypes.includes(type.toLowerCase());
  }
}

