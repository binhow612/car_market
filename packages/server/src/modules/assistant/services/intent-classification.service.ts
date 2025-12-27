import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { UserIntent } from '../dto/assistant-response.dto';

@Injectable()
export class IntentClassificationService {
  private readonly logger = new Logger(IntentClassificationService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not found. Intent classification will not work.',
      );
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async classifyIntent(userQuery: string): Promise<{
    intent: UserIntent;
    confidence: number;
    extractedEntities: any;
  }> {
    try {
      // Quick keyword check for car_valuation (high confidence keywords)
      const queryLower = userQuery.toLowerCase().trim();
      const valuationKeywords = [
        'valuation',
        'predict my car',
        'predict car price',
        'can you predict',
        'estimate my car',
        'estimate car price',
        'car price estimate',
        'định giá',
        'giá xe',
        'ước tính giá',
      ];
      
      // Check if query contains strong valuation keywords
      const hasValuationKeyword = valuationKeywords.some(keyword => 
        queryLower.includes(keyword)
      );
      
      // If query is just "valuation" or very short with valuation keyword, high confidence
      if (hasValuationKeyword && (queryLower === 'valuation' || queryLower.length < 30)) {
        this.logger.log(`Quick match: car_valuation (keyword-based)`);
        return {
          intent: UserIntent.CAR_VALUATION,
          confidence: 0.95,
          extractedEntities: {},
        };
      }

      const systemPrompt = `You are an intent classification system for a car marketplace application.
Analyze the user's query and classify it into ONE of these intents:

1. car_specs: User wants to know about car specifications, features, technical details, or characteristics of ANY car (in general or specific models)
   Examples: "What are the specs of Honda Civic?", "Tell me about BMW X5 features", "What's the fuel efficiency of Toyota Camry?"

2. car_listing: User wants to know about cars currently AVAILABLE FOR SALE in the shop/marketplace
   Examples: "What cars do you have?", "Show me available SUVs", "Do you have any Honda cars in stock?"

3. faq: User asks questions about the shop, buying process, services, policies, or general marketplace information. This includes asking HOW to price a car or pricing strategies, but NOT using the valuation tool.
   Examples: "What are your business hours?", "Do you offer financing?", "How do I buy a car?", "What's your return policy?", "How should I price my car?" (asking for advice, not using tool)

4. car_compare: User wants to COMPARE two or more different cars
   Examples: "Compare Honda Civic vs Toyota Corolla", "Which is better: BMW X5 or Mercedes GLE?", "Civic vs Accord differences"

5. user_info: User asks questions about THEIR OWN account, profile, listings, favorites, conversations, or activity
   Examples: "What are my listings?", "Show me my favorite cars", "Do I have any messages?", "What's my profile info?", "How many cars have I listed?", "What conversations do I have?", "Show my account details"

6. car_valuation: User wants to USE the car price estimation/valuation tool to get an actual price estimate for their car. This is when they want to INPUT car details and GET a price estimate back.
   Keywords: "predict", "predict price", "valuation", "estimate price", "car price", "car worth", "value of car", "price estimate", "định giá", "giá xe", "ước tính giá", "predict my car", "estimate my car"
   Examples: 
   - "can you predict my car price"
   - "valuation"
   - "How much is my car worth?"
   - "What's the value of my Honda Civic?"
   - "Định giá xe"
   - "Estimate car price"
   - "How much can I sell my car for?"
   - "Giá trị của xe Toyota Camry 2020"
   - "predict car price"
   - "car valuation"
   - "price estimation"
   
   IMPORTANT: If user asks about HOW to price a car or pricing strategies, that's FAQ. But if they want to USE the valuation tool/form, that's car_valuation.

Respond in JSON format:
{
  "intent": "car_specs|car_listing|faq|car_compare|user_info|car_valuation",
  "confidence": 0.0-1.0,
  "extractedEntities": {
    "carMakes": ["brand1", "brand2"],
    "carModels": ["model1", "model2"],
    "features": ["feature1", "feature2"],
    "keywords": ["keyword1", "keyword2"]
  }
}

Be precise and consider context carefully.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(responseContent);

      this.logger.log(
        `Intent classified: ${result.intent} (confidence: ${result.confidence})`,
      );

      return {
        intent: result.intent as UserIntent,
        confidence: result.confidence || 0.8,
        extractedEntities: result.extractedEntities || {},
      };
    } catch (error) {
      this.logger.error('Error classifying intent:', error);
      // Fallback to FAQ for general queries
      return {
        intent: UserIntent.FAQ,
        confidence: 0.5,
        extractedEntities: {},
      };
    }
  }

  /**
   * Extract specific entities from user query for better context
   */
  extractCarEntities(query: string): {
    makes: string[];
    models: string[];
  } {
    const queryLower = query.toLowerCase();
    const makes: string[] = [];
    const models: string[] = [];

    // Common car makes to look for
    const commonMakes = [
      'honda',
      'toyota',
      'bmw',
      'mercedes',
      'ford',
      'chevrolet',
      'nissan',
      'hyundai',
      'kia',
      'mazda',
      'volkswagen',
      'audi',
      'lexus',
      'subaru',
      'tesla',
    ];

    commonMakes.forEach((make) => {
      if (queryLower.includes(make)) {
        makes.push(
          make.charAt(0).toUpperCase() + make.slice(1).toLowerCase(),
        );
      }
    });

    return { makes, models };
  }
}

