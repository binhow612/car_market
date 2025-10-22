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
      const systemPrompt = `You are an intent classification system for a car marketplace application.
Analyze the user's query and classify it into ONE of these intents:

1. car_specs: User wants to know about car specifications, features, technical details, or characteristics of ANY car (in general or specific models)
   Examples: "What are the specs of Honda Civic?", "Tell me about BMW X5 features", "What's the fuel efficiency of Toyota Camry?"

2. car_listing: User wants to know about cars currently AVAILABLE FOR SALE in the shop/marketplace
   Examples: "What cars do you have?", "Show me available SUVs", "Do you have any Honda cars in stock?"

3. faq: User asks questions about the shop, buying process, services, policies, or general marketplace information
   Examples: "What are your business hours?", "Do you offer financing?", "How do I buy a car?", "What's your return policy?"

4. car_compare: User wants to COMPARE two or more different cars
   Examples: "Compare Honda Civic vs Toyota Corolla", "Which is better: BMW X5 or Mercedes GLE?", "Civic vs Accord differences"

5. user_info: User asks questions about THEIR OWN account, profile, listings, favorites, conversations, or activity
   Examples: "What are my listings?", "Show me my favorite cars", "Do I have any messages?", "What's my profile info?", "How many cars have I listed?", "What conversations do I have?", "Show my account details"

Respond in JSON format:
{
  "intent": "car_specs|car_listing|faq|car_compare|user_info",
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

