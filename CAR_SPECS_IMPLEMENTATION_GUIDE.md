# Car Specifications (car_specs) Intent - Implementation Guide

## 🎯 Overview

When users ask about car specifications for random cars or models (not necessarily in your inventory), the virtual assistant needs to provide accurate, comprehensive information from reliable sources. This is different from `car_listing` intent which queries your marketplace inventory.

## 📊 Current Implementation Analysis

### Current Approach (Limitations)
```typescript
// From response-handler.service.ts (lines 60-135)
// Current issues:
- Only queries cars in your marketplace listings
- Limited to basic fields (make, model, year, bodyType, fuelType, transmission)
- Relies on LLM general knowledge for cars not in inventory
- No dedicated car specifications database
- No external data source integration
```

### Example Scenarios
1. **User**: "What are the specs of 2024 Tesla Model 3?"
   - May not be in your inventory
   - Need comprehensive specs (range, battery, 0-60, safety features, etc.)

2. **User**: "Tell me about Honda Civic Type R engine specs"
   - Needs detailed engine information
   - Performance metrics, horsepower, torque

3. **User**: "What safety features does the BMW X5 have?"
   - Needs safety rating and feature list
   - IIHS/NHTSA ratings

## 🏗️ Recommended Pipeline Architecture

### **Pipeline Flow**

```
User Query → Intent Classification (car_specs) 
          ↓
    Entity Extraction (make, model, year, spec type)
          ↓
    Specs Retrieval Strategy
          ↓
    ┌─────────────────────────────────────┐
    │ 1. Check Local Database              │
    │ 2. Query External API/Database       │
    │ 3. Enrich with LLM Knowledge         │
    └─────────────────────────────────────┘
          ↓
    Format & Generate Response
          ↓
    Add Contextual Suggestions & Actions
          ↓
    Return to User
```

---

## 📋 Detailed Implementation Steps

### **Step 1: Enhanced Entity Extraction**

Create a new service: `car-specs-extraction.service.ts`

```typescript
interface ExtractedCarSpecs {
  make: string;              // e.g., "Honda"
  model: string;             // e.g., "Civic"
  year?: number;             // e.g., 2024
  trim?: string;             // e.g., "Type R", "EX-L"
  specCategory?: string;     // e.g., "engine", "safety", "dimensions", "performance"
  specificFeature?: string;  // e.g., "fuel efficiency", "horsepower"
  confidence: number;
}
```

**Use LLM to extract:**
```typescript
async extractCarSpecsQuery(userQuery: string): Promise<ExtractedCarSpecs> {
  const systemPrompt = `Extract car specification query details from user input.
  
  Identify:
  1. Car make (manufacturer)
  2. Car model
  3. Year (if mentioned)
  4. Trim level (if mentioned)
  5. Spec category: engine, performance, safety, dimensions, features, fuel_economy, interior, exterior
  6. Specific feature being asked about
  
  Examples:
  - "What are specs of 2024 Honda Civic?" → make: Honda, model: Civic, year: 2024, category: general
  - "BMW X5 horsepower" → make: BMW, model: X5, category: performance, feature: horsepower
  - "Tesla Model 3 range" → make: Tesla, model: Model 3, category: fuel_economy, feature: range
  
  Return JSON format with extracted data.`;
  
  // Call OpenAI to extract entities
  // Return structured data
}
```

---

### **Step 2: Data Source Strategy**

You need to decide on data sources. Here are the options:

#### **Option A: External Car Specs API (Recommended)**

**Top Car Data APIs:**

1. **NHTSA API (Free, US Government)**
   - URL: `https://vpic.nhtsa.dot.gov/api/`
   - Coverage: All US vehicles
   - Data: Make, model, body type, engine specs, safety ratings
   - Cost: **FREE** ✅
   - Limitations: US-focused, basic specs

2. **CarQueryAPI**
   - URL: `https://www.carqueryapi.com/`
   - Coverage: 2000+ car models
   - Data: Detailed specs (engine, performance, dimensions)
   - Cost: **FREE** (open-source) ✅
   - Limitations: Data up to ~2015, not actively maintained

3. **Edmunds API**
   - URL: `https://developer.edmunds.com/`
   - Coverage: Comprehensive US market
   - Data: Detailed specs, pricing, reviews
   - Cost: **Paid** (Contact for pricing)
   - Pro: Very comprehensive and up-to-date

4. **AutoDev API**
   - URL: `https://www.autodevapi.com/`
   - Coverage: Global vehicle database
   - Data: Technical specs, images, market data
   - Cost: **Paid** (Starts ~$29/month)
   - Pro: Modern, RESTful, well-documented

5. **Marketcheck API**
   - URL: `https://www.marketcheck.com/automotive/`
   - Coverage: US vehicles with specs
   - Data: Listings + specs
   - Cost: **Paid**

6. **CarMD API**
   - URL: `https://api.carmd.com/`
   - Coverage: Vehicle diagnostics + specs
   - Data: VIN decoding, maintenance, recalls
   - Cost: **Paid**

**Recommendation:**
- **Start with NHTSA API (Free)** for basic specs
- **Add CarQueryAPI (Free)** for additional details
- **Upgrade to Edmunds/AutoDev** when you have budget for comprehensive data

#### **Option B: Build Your Own Database**

**Pros:**
- Full control
- No API rate limits
- Fast response times
- Customizable data structure

**Cons:**
- Requires manual data collection
- Ongoing maintenance for new models
- Time-consuming initial setup

**Implementation:**
```sql
-- Create car_specifications table
CREATE TABLE car_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  trim VARCHAR(100),
  
  -- Engine specs
  engine_type VARCHAR(100),
  engine_size DECIMAL(4,2), -- in liters
  cylinders INTEGER,
  horsepower INTEGER,
  torque INTEGER,
  
  -- Performance
  acceleration_0_60 DECIMAL(4,2), -- seconds
  top_speed INTEGER, -- mph
  quarter_mile DECIMAL(4,2),
  
  -- Fuel economy
  mpg_city INTEGER,
  mpg_highway INTEGER,
  mpg_combined INTEGER,
  fuel_tank_capacity DECIMAL(4,2),
  
  -- Dimensions
  length DECIMAL(6,2), -- inches
  width DECIMAL(6,2),
  height DECIMAL(6,2),
  wheelbase DECIMAL(6,2),
  curb_weight INTEGER, -- lbs
  cargo_volume DECIMAL(6,2), -- cubic feet
  
  -- Safety
  nhtsa_overall_rating INTEGER, -- 1-5 stars
  iihs_overall_rating VARCHAR(50),
  safety_features TEXT[], -- array of features
  
  -- Technology features
  infotainment_system TEXT,
  driver_assistance_features TEXT[],
  
  -- Other
  warranty_basic VARCHAR(100),
  warranty_powertrain VARCHAR(100),
  msrp INTEGER,
  
  -- Metadata
  data_source VARCHAR(100), -- 'manual', 'api', 'import'
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(make, model, year, trim)
);

CREATE INDEX idx_car_specs_make_model ON car_specifications(make, model);
CREATE INDEX idx_car_specs_year ON car_specifications(year);
```

#### **Option C: Hybrid Approach (Best)**

Combine multiple sources with fallback strategy:

```typescript
class CarSpecsDataService {
  async getCarSpecs(make: string, model: string, year?: number) {
    // 1. Check local database first (fast)
    const localSpecs = await this.getFromDatabase(make, model, year);
    if (localSpecs && this.isFresh(localSpecs)) {
      return localSpecs;
    }
    
    // 2. Query external API
    try {
      const apiSpecs = await this.getFromExternalAPI(make, model, year);
      // Cache in database
      await this.cacheSpecs(apiSpecs);
      return apiSpecs;
    } catch (error) {
      // 3. Fallback to LLM knowledge
      return this.getFromLLM(make, model, year);
    }
  }
}
```

---

### **Step 3: Create Car Specs Retrieval Service**

Create: `packages/server/src/modules/assistant/services/car-specs-retrieval.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import OpenAI from 'openai';

export interface CarSpecsData {
  make: string;
  model: string;
  year?: number;
  trim?: string;
  
  // Engine & Performance
  engine?: {
    type?: string;
    size?: number;
    cylinders?: number;
    horsepower?: number;
    torque?: number;
    fuelType?: string;
  };
  
  performance?: {
    acceleration_0_60?: number;
    topSpeed?: number;
    quarterMile?: number;
  };
  
  // Fuel Economy
  fuelEconomy?: {
    city?: number;
    highway?: number;
    combined?: number;
  };
  
  // Dimensions
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
    curbWeight?: number;
    cargoVolume?: number;
  };
  
  // Safety
  safety?: {
    nhtsaRating?: number;
    iihsRating?: string;
    features?: string[];
  };
  
  // Features
  features?: {
    standard?: string[];
    optional?: string[];
    technology?: string[];
  };
  
  // Pricing
  pricing?: {
    msrp?: number;
    invoicePrice?: number;
  };
  
  // Source metadata
  dataSource: 'database' | 'nhtsa' | 'carquery' | 'llm' | 'hybrid';
  confidence: number;
  lastUpdated: Date;
}

@Injectable()
export class CarSpecsRetrievalService {
  private readonly logger = new Logger(CarSpecsRetrievalService.name);
  private openai: OpenAI;
  
  constructor(
    // Inject your car_specifications repository if you create the table
    // @InjectRepository(CarSpecification)
    // private specsRepository: Repository<CarSpecification>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }
  
  /**
   * Main method to retrieve car specifications
   */
  async getCarSpecifications(
    make: string,
    model: string,
    year?: number,
  ): Promise<CarSpecsData> {
    this.logger.log(`Fetching specs for: ${year || ''} ${make} ${model}`);
    
    try {
      // Strategy 1: Check local database
      const cachedSpecs = await this.getFromCache(make, model, year);
      if (cachedSpecs) {
        return cachedSpecs;
      }
      
      // Strategy 2: Try NHTSA API (Free, US vehicles)
      const nhtsaSpecs = await this.fetchFromNHTSA(make, model, year);
      if (nhtsaSpecs) {
        await this.cacheSpecs(nhtsaSpecs);
        return nhtsaSpecs;
      }
      
      // Strategy 3: Try CarQuery API (Free, but older data)
      const carQuerySpecs = await this.fetchFromCarQuery(make, model, year);
      if (carQuerySpecs) {
        await this.cacheSpecs(carQuerySpecs);
        return carQuerySpecs;
      }
      
      // Strategy 4: Fallback to LLM knowledge
      const llmSpecs = await this.fetchFromLLM(make, model, year);
      return llmSpecs;
      
    } catch (error) {
      this.logger.error('Error fetching car specs:', error);
      throw error;
    }
  }
  
  /**
   * Check local cache/database
   */
  private async getFromCache(
    make: string,
    model: string,
    year?: number,
  ): Promise<CarSpecsData | null> {
    // TODO: Implement database cache lookup
    // Check if data exists and is fresh (< 30 days old)
    return null;
  }
  
  /**
   * Fetch from NHTSA API (Free US Government API)
   */
  private async fetchFromNHTSA(
    make: string,
    model: string,
    year?: number,
  ): Promise<CarSpecsData | null> {
    try {
      // NHTSA API Example
      const baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';
      
      // Get make ID
      const makeUrl = `${baseUrl}/getallmakes?format=json`;
      const makeResponse = await axios.get(makeUrl);
      const makeData = makeResponse.data.Results.find(
        (m: any) => m.Make_Name.toLowerCase() === make.toLowerCase()
      );
      
      if (!makeData) return null;
      
      // Get models for make
      const modelUrl = `${baseUrl}/getmodelsformakeyear/make/${make}/modelyear/${year || new Date().getFullYear()}?format=json`;
      const modelResponse = await axios.get(modelUrl);
      const modelData = modelResponse.data.Results.find(
        (m: any) => m.Model_Name.toLowerCase() === model.toLowerCase()
      );
      
      if (!modelData) return null;
      
      // Get vehicle specs
      const specsUrl = `${baseUrl}/getvehiclevariablevalueslist/make%20id?format=json`;
      // Note: NHTSA API requires model year and model ID for detailed specs
      
      // Transform NHTSA data to our format
      const specs: CarSpecsData = {
        make,
        model,
        year,
        dataSource: 'nhtsa',
        confidence: 0.8,
        lastUpdated: new Date(),
        // Map NHTSA fields to our structure
      };
      
      return specs;
      
    } catch (error) {
      this.logger.warn(`NHTSA API error for ${make} ${model}:`, error.message);
      return null;
    }
  }
  
  /**
   * Fetch from CarQuery API (Free but older data)
   */
  private async fetchFromCarQuery(
    make: string,
    model: string,
    year?: number,
  ): Promise<CarSpecsData | null> {
    try {
      const url = 'https://www.carqueryapi.com/api/0.3/';
      
      // Get trims for the car
      const response = await axios.get(url, {
        params: {
          cmd: 'getTrims',
          make,
          model,
          year: year || new Date().getFullYear(),
        },
      });
      
      if (!response.data.Trims || response.data.Trims.length === 0) {
        return null;
      }
      
      // Get first trim details
      const trim = response.data.Trims[0];
      const modelId = trim.model_id;
      
      // Get detailed specs
      const detailResponse = await axios.get(url, {
        params: {
          cmd: 'getModel',
          model: modelId,
        },
      });
      
      const details = detailResponse.data[0];
      
      // Transform to our format
      const specs: CarSpecsData = {
        make: details.model_make_id,
        model: details.model_name,
        year: parseInt(details.model_year),
        trim: details.model_trim,
        engine: {
          type: details.model_engine_type,
          size: parseFloat(details.model_engine_l),
          cylinders: parseInt(details.model_engine_cyl),
          horsepower: parseInt(details.model_engine_power_hp),
          torque: parseInt(details.model_engine_torque_lbft),
          fuelType: details.model_engine_fuel,
        },
        dimensions: {
          length: parseFloat(details.model_length_mm) / 25.4, // Convert to inches
          width: parseFloat(details.model_width_mm) / 25.4,
          height: parseFloat(details.model_height_mm) / 25.4,
          wheelbase: parseFloat(details.model_wheelbase_mm) / 25.4,
          curbWeight: parseInt(details.model_weight_kg) * 2.20462, // Convert to lbs
        },
        dataSource: 'carquery',
        confidence: 0.7,
        lastUpdated: new Date(),
      };
      
      return specs;
      
    } catch (error) {
      this.logger.warn(`CarQuery API error for ${make} ${model}:`, error.message);
      return null;
    }
  }
  
  /**
   * Use LLM to get car specifications (fallback)
   */
  private async fetchFromLLM(
    make: string,
    model: string,
    year?: number,
  ): Promise<CarSpecsData> {
    const prompt = `Provide comprehensive technical specifications for ${year || 'latest'} ${make} ${model}.
    
    Include:
    1. Engine specifications (type, size, cylinders, horsepower, torque)
    2. Performance metrics (0-60 mph, top speed)
    3. Fuel economy (city/highway MPG)
    4. Dimensions (length, width, height, weight)
    5. Safety ratings and features
    6. Standard and optional features
    7. MSRP pricing
    
    Format as JSON matching this structure:
    {
      "engine": { "type": "", "size": 0, "horsepower": 0, ... },
      "performance": { "acceleration_0_60": 0, ... },
      "fuelEconomy": { "city": 0, "highway": 0, ... },
      "dimensions": { ... },
      "safety": { ... },
      "features": { ... },
      "pricing": { "msrp": 0 }
    }`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a car specifications expert. Provide accurate, detailed technical data.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      
      const llmData = JSON.parse(completion.choices[0].message.content);
      
      return {
        make,
        model,
        year,
        ...llmData,
        dataSource: 'llm',
        confidence: 0.6, // Lower confidence for LLM-generated data
        lastUpdated: new Date(),
      };
      
    } catch (error) {
      this.logger.error('LLM specs fetch error:', error);
      throw error;
    }
  }
  
  /**
   * Cache specs in database for future requests
   */
  private async cacheSpecs(specs: CarSpecsData): Promise<void> {
    // TODO: Implement database caching
    // Save to car_specifications table
    this.logger.log(`Caching specs for ${specs.make} ${specs.model}`);
  }
  
  /**
   * Format specs data for natural language response
   */
  formatSpecsForResponse(specs: CarSpecsData, specificCategory?: string): string {
    let formatted = '';
    
    if (specificCategory === 'engine' && specs.engine) {
      formatted = `Engine: ${specs.engine.type || 'N/A'}, `;
      formatted += `${specs.engine.size}L ${specs.engine.cylinders}-cylinder, `;
      formatted += `${specs.engine.horsepower} HP, ${specs.engine.torque} lb-ft torque`;
    } else if (specificCategory === 'performance' && specs.performance) {
      formatted = `Performance: 0-60 mph in ${specs.performance.acceleration_0_60}s, `;
      formatted += `Top speed: ${specs.performance.topSpeed} mph`;
    } else {
      // General overview
      formatted = JSON.stringify(specs, null, 2);
    }
    
    return formatted;
  }
}
```

---

### **Step 4: Enhanced Response Handler**

Update `response-handler.service.ts`:

```typescript
import { CarSpecsRetrievalService } from './car-specs-retrieval.service';

private async handleCarSpecs(
  userQuery: string,
  extractedEntities: any,
): Promise<AssistantResponseDto> {
  try {
    // Extract car details from query
    const { make, model, year, specCategory } = 
      await this.extractCarSpecsQuery(userQuery, extractedEntities);
    
    if (!make || !model) {
      return this.askForClarification();
    }
    
    // Get comprehensive specs
    const specs = await this.carSpecsRetrievalService.getCarSpecifications(
      make,
      model,
      year,
    );
    
    // Generate natural language response using LLM
    const message = await this.generateSpecsResponse(
      userQuery,
      specs,
      specCategory,
    );
    
    // Check if car is available in your marketplace
    const availableListings = await this.checkAvailability(make, model, year);
    
    // Create actions
    const actions: MessageAction[] = [];
    if (availableListings.length > 0) {
      actions.push({
        label: `View ${availableListings.length} available ${make} ${model}`,
        action: 'search_listings',
        data: { make, model, year },
      });
    }
    
    // Generate suggestions
    const suggestions = this.generateSpecsSuggestions(make, model, specs);
    
    return {
      intent: UserIntent.CAR_SPECS,
      message,
      data: {
        specifications: specs,
        availableInStock: availableListings.length > 0,
        dataSource: specs.dataSource,
        confidence: specs.confidence,
      },
      suggestions,
      actions,
    };
    
  } catch (error) {
    this.logger.error('Error handling car specs:', error);
    return this.getErrorResponse();
  }
}

/**
 * Generate natural language response using LLM with specs context
 */
private async generateSpecsResponse(
  userQuery: string,
  specs: CarSpecsData,
  category?: string,
): Promise<string> {
  const systemPrompt = `You are a car expert assistant. 
  Provide a natural, conversational response about car specifications.
  
  Guidelines:
  - Be enthusiastic and knowledgeable
  - Highlight key specs relevant to the user's question
  - Use conversational language, not technical jargon unless appropriate
  - If specs are missing, mention it naturally
  - Keep response 3-5 sentences
  - Mention data source reliability if confidence < 0.7`;
  
  const userPrompt = `User asked: "${userQuery}"
  
  Car specifications for ${specs.year || ''} ${specs.make} ${specs.model}:
  ${JSON.stringify(specs, null, 2)}
  
  Focus area: ${category || 'general overview'}
  Data source: ${specs.dataSource}
  Confidence: ${specs.confidence}
  
  Provide a helpful, natural response.`;
  
  const completion = await this.openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });
  
  return completion.choices[0].message.content;
}

/**
 * Generate contextual suggestions based on specs query
 */
private generateSpecsSuggestions(
  make: string,
  model: string,
  specs: CarSpecsData,
): SuggestionChip[] {
  return [
    {
      id: '1',
      label: 'Compare with competitors',
      query: `Compare ${make} ${model} with similar cars`,
      icon: '⚖️',
    },
    {
      id: '2',
      label: 'View available inventory',
      query: `Show me ${make} ${model} in stock`,
      icon: '🚗',
    },
    {
      id: '3',
      label: 'Safety ratings',
      query: `What are the safety ratings for ${make} ${model}?`,
      icon: '🛡️',
    },
    {
      id: '4',
      label: 'Fuel efficiency',
      query: `What's the fuel economy of ${make} ${model}?`,
      icon: '⛽',
    },
  ];
}
```

---

### **Step 5: Update Module**

Update `assistant.module.ts`:

```typescript
import { CarSpecsRetrievalService } from './services/car-specs-retrieval.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingDetail,
      CarMetadata,
      CarMake,
      CarModel,
      // Add if you create the table:
      // CarSpecification,
    ]),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    IntentClassificationService,
    QueryExtractionService,
    ListingQueryBuilderService,
    ResponseHandlerService,
    CarSpecsRetrievalService, // Add this
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
```

---

## 🎯 Recommended Implementation Approach

### **Phase 1: Quick Win (1-2 days)**
1. ✅ Use NHTSA API (free) for basic specs
2. ✅ Fallback to LLM for missing data
3. ✅ Simple response generation
4. ✅ No database caching yet

### **Phase 2: Enhanced (3-5 days)**
1. ✅ Add CarQuery API for more details
2. ✅ Implement database caching
3. ✅ Better entity extraction
4. ✅ Contextual suggestions

### **Phase 3: Production Ready (1-2 weeks)**
1. ✅ Add paid API (Edmunds/AutoDev) for comprehensive data
2. ✅ Build car_specifications table
3. ✅ Implement data refresh strategy
4. ✅ Add analytics and monitoring
5. ✅ Performance optimization

---

## 📊 Data Source Comparison

| Source | Cost | Coverage | Accuracy | Freshness | Ease of Use |
|--------|------|----------|----------|-----------|-------------|
| **NHTSA API** | Free | US vehicles | High | Current | Easy |
| **CarQuery** | Free | 2000+ models | Medium | Up to 2015 | Easy |
| **LLM (GPT)** | Token cost | All vehicles | Medium | Current | Very Easy |
| **Edmunds** | Paid | Comprehensive | Very High | Current | Medium |
| **AutoDev** | Paid | Global | Very High | Current | Easy |
| **Own Database** | Dev time | Custom | High | Manual | Hard |

---

## 🔄 Caching Strategy

```typescript
// Cache freshness rules
const CACHE_TTL = {
  specs: 30 * 24 * 60 * 60 * 1000,  // 30 days
  pricing: 7 * 24 * 60 * 60 * 1000,  // 7 days (changes more frequently)
  safety: 90 * 24 * 60 * 60 * 1000,  // 90 days (rarely changes)
};

// Cache invalidation
- Update when new model year is released
- Refresh on API data change
- Manual refresh option for admin
```

---

## 🧪 Testing Queries

Test your implementation with these queries:

1. **General specs**: "What are the specs of Honda Civic?"
2. **Year specific**: "Tell me about 2024 Tesla Model 3"
3. **Engine focused**: "What's the horsepower of BMW M3?"
4. **Fuel economy**: "How fuel efficient is Toyota Prius?"
5. **Safety**: "What are the safety features of Volvo XC90?"
6. **Dimensions**: "How big is Chevrolet Tahoe?"
7. **Performance**: "What's the 0-60 time of Porsche 911?"
8. **Comparison prep**: "Tell me about Honda CR-V specifications"

---

## 📈 Success Metrics

Track these metrics:

1. **Data Coverage**: % of queries with complete specs
2. **Response Time**: Time to fetch and format specs
3. **Data Accuracy**: User feedback on correctness
4. **Source Distribution**: % from cache vs API vs LLM
5. **User Satisfaction**: Follow-up actions taken
6. **Cost**: API costs and LLM token usage

---

## 🚀 Quick Start Commands

```bash
# 1. Install axios for API calls
cd packages/server
npm install axios

# 2. Create the new service file
# (Use the code provided above)

# 3. Update assistant.module.ts

# 4. Test with sample queries
curl -X POST http://localhost:3000/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the specs of Honda Civic?"}'
```

---

## 🔒 Security & Rate Limiting

```typescript
// Implement rate limiting for external APIs
class ApiRateLimiter {
  private requestCounts = new Map<string, number>();
  private readonly MAX_REQUESTS_PER_HOUR = 100;
  
  async checkLimit(apiName: string): Promise<boolean> {
    const count = this.requestCounts.get(apiName) || 0;
    if (count >= this.MAX_REQUESTS_PER_HOUR) {
      return false;
    }
    this.requestCounts.set(apiName, count + 1);
    return true;
  }
}

// Don't expose API keys in client-side code
// Store in environment variables
// Use proxy pattern if needed
```

---

## 📝 Summary

**Best Pipeline for car_specs:**

```
1. Extract entities (make, model, year, spec category)
   ↓
2. Check local database cache (fast)
   ↓
3. If not cached or stale:
   a. Try NHTSA API (free, reliable)
   b. Try CarQuery API (free, more details)
   c. Fallback to LLM (always works)
   ↓
4. Cache the results (30-day TTL)
   ↓
5. Format data for specific question
   ↓
6. Generate natural language response with LLM
   ↓
7. Add actions (view inventory, compare)
   ↓
8. Add suggestions (related queries)
   ↓
9. Return to user
```

**Estimated Development Time:**
- Basic implementation: 2-3 days
- With caching: 4-5 days
- Production ready: 1-2 weeks

**Recommended Start:**
Use NHTSA + LLM fallback. This gives you:
- ✅ Free solution
- ✅ Quick implementation  
- ✅ Good accuracy
- ✅ Scalable foundation

Then enhance with caching and additional APIs as needed.

---

## 🎓 Next Steps

1. Review this pipeline design
2. Choose data source strategy
3. Implement Phase 1 (NHTSA + LLM)
4. Test thoroughly
5. Add caching (Phase 2)
6. Consider paid APIs (Phase 3)

**Need help implementing any specific part? Let me know!**


