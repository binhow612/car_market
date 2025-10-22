# Car Specs Using Web Search - Implementation Guide

## 🎯 Concept Overview

Instead of using dedicated car APIs, use **web search + scraping** to get real-time, comprehensive car specifications from authoritative sources.

```
User Query → Extract Keywords → Build Search Query → Search Google/Bing 
  → Scrape Top 2-3 Results → Extract Relevant Info → Feed to LLM → Generate Response
```

## ✨ Why This Approach is Brilliant

### **Advantages** ✅
1. **Always Current**: Gets latest information from the web
2. **Universal Coverage**: Works for ANY car (even brand new models)
3. **Rich Context**: Includes reviews, comparisons, expert opinions
4. **No API Limits**: Not restricted to specific databases
5. **Quality Sources**: Can target Car & Driver, Edmunds, MotorTrend, etc.
6. **Cost-Effective**: Cheaper than premium car data APIs
7. **Flexible**: Can adapt to different query types

### **Challenges** ⚠️
1. Need to scrape/parse web pages (can be fragile)
2. Slower than direct API calls
3. Need to handle different website formats
4. May need to respect robots.txt and rate limits
5. Content extraction accuracy varies

---

## 🏗️ Complete Pipeline Architecture

### **Step-by-Step Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER QUERY                                                   │
│    "What are the specs of 2024 Honda Civic?"                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. EXTRACT SEARCH KEYWORDS (using LLM)                         │
│    Input: "What are the specs of 2024 Honda Civic?"           │
│    Output: {                                                    │
│      make: "Honda",                                            │
│      model: "Civic",                                           │
│      year: 2024,                                               │
│      focus: "specifications",                                  │
│      searchQuery: "2024 Honda Civic specifications horsepower  │
│                    fuel economy dimensions safety features"    │
│    }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BUILD TARGETED SEARCH QUERY                                 │
│    Strategy A: General search                                  │
│      "2024 Honda Civic specifications engine performance"      │
│                                                                 │
│    Strategy B: Target specific sites                           │
│      "site:caranddriver.com 2024 Honda Civic specs"           │
│      "site:edmunds.com 2024 Honda Civic specifications"        │
│      "site:motortrend.com 2024 Honda Civic review specs"       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. EXECUTE WEB SEARCH                                          │
│    ┌────────────────────────────────────────────────┐         │
│    │ Option A: Google Custom Search API (Paid)      │         │
│    │ • $5 per 1000 queries after 100 free/day      │         │
│    │ • Structured results                            │         │
│    │ • Reliable                                      │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    ┌────────────────────────────────────────────────┐         │
│    │ Option B: Serper API (Cheap) ⭐ RECOMMENDED    │         │
│    │ • $5 for 2500 searches                         │         │
│    │ • Google results                                │         │
│    │ • Easy to use                                   │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    ┌────────────────────────────────────────────────┐         │
│    │ Option C: Bing Search API (Free Tier)          │         │
│    │ • 3 calls/sec free tier                        │         │
│    │ • Good results                                  │         │
│    │ • Microsoft backed                              │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    Returns: Top 10 search results with URLs & snippets        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SCRAPE & EXTRACT CONTENT FROM TOP 3 RESULTS                │
│    ┌────────────────────────────────────────────────┐         │
│    │ Result 1: caranddriver.com/honda-civic         │         │
│    │ → Scrape full article                          │         │
│    │ → Extract specs table, text content            │         │
│    │ → Get: Engine, HP, MPG, Features              │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    ┌────────────────────────────────────────────────┐         │
│    │ Result 2: edmunds.com/honda/civic/2024         │         │
│    │ → Scrape specifications page                   │         │
│    │ → Extract: Dimensions, Safety, Tech           │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    ┌────────────────────────────────────────────────┐         │
│    │ Result 3: motortrend.com/reviews/honda-civic   │         │
│    │ → Scrape review content                        │         │
│    │ → Extract: Performance data, ratings          │         │
│    └────────────────────────────────────────────────┘         │
│                                                                 │
│    Tools: Cheerio, Puppeteer, or Jina AI Reader API           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CLEAN & CONSOLIDATE INFORMATION                            │
│    • Remove ads, navigation, irrelevant content               │
│    • Extract only specs and relevant text                     │
│    • Combine data from multiple sources                       │
│    • Deduplicate information                                  │
│    • Organize by category                                     │
│                                                                 │
│    Output: Consolidated text (2000-3000 tokens)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FEED TO LLM WITH CONTEXT                                   │
│    System Prompt: "You are a car expert assistant. Use the    │
│    following information from reliable sources to answer..."   │
│                                                                 │
│    Context: [Scraped content from 3 sources]                  │
│    User Query: "What are the specs of 2024 Honda Civic?"     │
│                                                                 │
│    LLM generates natural, accurate response with citations    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. RETURN ENHANCED RESPONSE TO USER                           │
│    "The 2024 Honda Civic offers impressive specifications...   │
│    [detailed specs from web sources]                          │
│                                                                 │
│    Sources: Car and Driver, Edmunds, MotorTrend"             │
│                                                                 │
│    + Actions: [View in stock] [Compare cars]                  │
│    + Suggestions: [Safety ratings] [Fuel efficiency] [Review] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation Code

### **Step 1: Create Web Search Service**

Create: `packages/server/src/modules/assistant/services/web-search.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  specs?: Record<string, any>;
}

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  /**
   * Search the web using Serper API (recommended) or Google Custom Search
   */
  async searchWeb(query: string, numResults: number = 5): Promise<SearchResult[]> {
    try {
      // Option A: Serper API (Recommended - cheap and easy)
      return await this.searchWithSerper(query, numResults);
      
      // Option B: Google Custom Search API
      // return await this.searchWithGoogle(query, numResults);
      
      // Option C: Bing Search API
      // return await this.searchWithBing(query, numResults);
      
    } catch (error) {
      this.logger.error('Web search error:', error);
      throw error;
    }
  }

  /**
   * Serper API - $5 for 2500 searches (Recommended)
   * https://serper.dev/
   */
  private async searchWithSerper(
    query: string,
    numResults: number,
  ): Promise<SearchResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      throw new Error('SERPER_API_KEY not configured');
    }

    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query,
        num: numResults,
        gl: 'us', // Country: United States
        hl: 'en', // Language: English
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    const results: SearchResult[] = response.data.organic?.map(
      (result: any, index: number) => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        position: index + 1,
      }),
    ) || [];

    this.logger.log(`Found ${results.length} search results for: ${query}`);
    return results;
  }

  /**
   * Google Custom Search API - 100 free/day, then $5 per 1000
   * https://developers.google.com/custom-search
   */
  private async searchWithGoogle(
    query: string,
    numResults: number,
  ): Promise<SearchResult[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      throw new Error('Google Custom Search not configured');
    }

    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: Math.min(numResults, 10), // Max 10 per request
        },
      },
    );

    return response.data.items?.map((item: any, index: number) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      position: index + 1,
    })) || [];
  }

  /**
   * Bing Search API - Has free tier
   * https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
   */
  private async searchWithBing(
    query: string,
    numResults: number,
  ): Promise<SearchResult[]> {
    const apiKey = process.env.BING_SEARCH_API_KEY;
    if (!apiKey) {
      throw new Error('BING_SEARCH_API_KEY not configured');
    }

    const response = await axios.get(
      'https://api.bing.microsoft.com/v7.0/search',
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        params: {
          q: query,
          count: numResults,
          mkt: 'en-US',
        },
      },
    );

    return response.data.webPages?.value?.map((item: any, index: number) => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet,
      position: index + 1,
    })) || [];
  }

  /**
   * Scrape and extract content from a URL
   */
  async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      // Option A: Use Jina AI Reader API (Recommended - handles JS, ads, etc.)
      return await this.scrapeWithJina(url);
      
      // Option B: Simple scraping with axios + cheerio
      // return await this.scrapeWithCheerio(url);
      
    } catch (error) {
      this.logger.error(`Error scraping ${url}:`, error.message);
      return {
        url,
        title: '',
        content: '',
      };
    }
  }

  /**
   * Jina AI Reader API - Clean, readable content (FREE)
   * https://jina.ai/reader
   */
  private async scrapeWithJina(url: string): Promise<ScrapedContent> {
    // Jina AI provides a free API that converts any URL to clean, LLM-friendly text
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    const response = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        // Optional: Add API key for higher limits
        // 'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      },
      timeout: 10000,
    });

    return {
      url,
      title: response.data.data?.title || '',
      content: response.data.data?.content || '',
    };
  }

  /**
   * Simple scraping with Cheerio (for basic HTML)
   */
  private async scrapeWithCheerio(url: string): Promise<ScrapedContent> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();

    // Extract title
    const title = $('h1').first().text() || $('title').text();

    // Extract main content
    let content = '';
    
    // Try common content containers
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      'main',
      '.specs-table',
      '.specifications',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content += element.text() + '\n';
      }
    }

    // Fallback: get all paragraphs
    if (!content) {
      $('p').each((_, elem) => {
        content += $(elem).text() + '\n';
      });
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return {
      url,
      title,
      content: content.substring(0, 5000), // Limit content length
    };
  }

  /**
   * Scrape multiple URLs in parallel
   */
  async scrapeMultipleUrls(urls: string[]): Promise<ScrapedContent[]> {
    const promises = urls.map(url => this.scrapeUrl(url));
    const results = await Promise.allSettled(promises);

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<ScrapedContent>).value)
      .filter(content => content.content.length > 100); // Filter out failed scrapes
  }
}
```

---

### **Step 2: Create Search Query Builder**

Create: `packages/server/src/modules/assistant/services/search-query-builder.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface SearchQueryParams {
  make: string;
  model: string;
  year?: number;
  focus?: string; // 'specs', 'performance', 'safety', 'review'
  searchQueries: string[]; // Multiple search queries to try
}

@Injectable()
export class SearchQueryBuilderService {
  private readonly logger = new Logger(SearchQueryBuilderService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  /**
   * Extract search parameters and build optimized search queries
   */
  async buildSearchQueries(userQuery: string): Promise<SearchQueryParams> {
    try {
      const systemPrompt = `You are an expert at building effective web search queries for car information.
      
      Extract:
      1. Car make, model, year
      2. User's focus (specifications, performance, safety, review, comparison)
      3. Generate 2-3 optimized search queries targeting reliable car websites
      
      Reliable car sites to target:
      - caranddriver.com
      - edmunds.com
      - motortrend.com
      - cars.com
      - kbb.com (Kelley Blue Book)
      - autotrader.com
      - consumerreports.org
      
      Return JSON:
      {
        "make": "Honda",
        "model": "Civic",
        "year": 2024,
        "focus": "specs",
        "searchQueries": [
          "2024 Honda Civic specifications site:caranddriver.com",
          "2024 Honda Civic specs horsepower fuel economy site:edmunds.com",
          "2024 Honda Civic technical specifications performance"
        ]
      }`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      this.logger.log(`Built search queries: ${JSON.stringify(result.searchQueries)}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error building search queries:', error);
      
      // Fallback: simple query construction
      return {
        make: '',
        model: '',
        searchQueries: [userQuery],
      };
    }
  }
}
```

---

### **Step 3: Create Car Specs Search Service (Main Orchestrator)**

Create: `packages/server/src/modules/assistant/services/car-specs-search.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { WebSearchService, SearchResult, ScrapedContent } from './web-search.service';
import { SearchQueryBuilderService } from './search-query-builder.service';

export interface CarSpecsSearchResult {
  make: string;
  model: string;
  year?: number;
  sources: {
    title: string;
    url: string;
  }[];
  content: string; // Consolidated content for LLM
  confidence: number;
}

@Injectable()
export class CarSpecsSearchService {
  private readonly logger = new Logger(CarSpecsSearchService.name);
  private openai: OpenAI;

  constructor(
    private readonly webSearchService: WebSearchService,
    private readonly searchQueryBuilder: SearchQueryBuilderService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  /**
   * Main method: Search web for car specs and consolidate information
   */
  async searchCarSpecs(userQuery: string): Promise<CarSpecsSearchResult> {
    try {
      // Step 1: Build optimized search queries
      const searchParams = await this.searchQueryBuilder.buildSearchQueries(userQuery);
      
      // Step 2: Execute web search (use first query)
      const searchQuery = searchParams.searchQueries[0];
      const searchResults = await this.webSearchService.searchWeb(searchQuery, 5);
      
      if (searchResults.length === 0) {
        throw new Error('No search results found');
      }
      
      // Step 3: Filter for reliable car websites
      const reliableResults = this.filterReliableSources(searchResults);
      const topResults = reliableResults.slice(0, 3); // Take top 3
      
      this.logger.log(`Scraping ${topResults.length} URLs`);
      
      // Step 4: Scrape content from top results
      const urls = topResults.map(r => r.url);
      const scrapedContents = await this.webSearchService.scrapeMultipleUrls(urls);
      
      if (scrapedContents.length === 0) {
        throw new Error('Failed to scrape any content');
      }
      
      // Step 5: Consolidate and clean content
      const consolidatedContent = this.consolidateContent(scrapedContents);
      
      // Step 6: Return structured result
      return {
        make: searchParams.make,
        model: searchParams.model,
        year: searchParams.year,
        sources: scrapedContents.map(c => ({
          title: c.title,
          url: c.url,
        })),
        content: consolidatedContent,
        confidence: this.calculateConfidence(scrapedContents),
      };
      
    } catch (error) {
      this.logger.error('Error searching car specs:', error);
      throw error;
    }
  }

  /**
   * Filter search results to prioritize reliable car websites
   */
  private filterReliableSources(results: SearchResult[]): SearchResult[] {
    const reliableDomains = [
      'caranddriver.com',
      'edmunds.com',
      'motortrend.com',
      'cars.com',
      'kbb.com',
      'autotrader.com',
      'consumerreports.org',
      'automotive.com',
      'carpro.com',
    ];

    // Sort: reliable sources first, then by position
    return results.sort((a, b) => {
      const aDomain = new URL(a.url).hostname;
      const bDomain = new URL(b.url).hostname;
      
      const aReliable = reliableDomains.some(d => aDomain.includes(d));
      const bReliable = reliableDomains.some(d => bDomain.includes(d));
      
      if (aReliable && !bReliable) return -1;
      if (!aReliable && bReliable) return 1;
      
      return a.position - b.position;
    });
  }

  /**
   * Consolidate content from multiple sources
   */
  private consolidateContent(contents: ScrapedContent[]): string {
    let consolidated = '';
    
    contents.forEach((content, index) => {
      consolidated += `\n\n--- Source ${index + 1}: ${content.title} (${content.url}) ---\n`;
      consolidated += content.content.substring(0, 2000); // Limit per source
    });

    // Clean up and limit total length
    consolidated = consolidated
      .replace(/\s+/g, ' ')
      .substring(0, 6000); // Total limit for LLM context
    
    return consolidated;
  }

  /**
   * Calculate confidence score based on content quality
   */
  private calculateConfidence(contents: ScrapedContent[]): number {
    if (contents.length === 0) return 0;
    
    let score = 0.5; // Base score
    
    // More sources = higher confidence
    score += contents.length * 0.1;
    
    // Longer content = higher confidence (but cap at 3 sources)
    const avgLength = contents.reduce((sum, c) => sum + c.content.length, 0) / contents.length;
    if (avgLength > 1000) score += 0.2;
    
    // Cap at 0.95
    return Math.min(score, 0.95);
  }

  /**
   * Generate final response using LLM with web search context
   */
  async generateResponseWithWebContext(
    userQuery: string,
    searchResult: CarSpecsSearchResult,
  ): Promise<string> {
    const systemPrompt = `You are a knowledgeable car expert assistant.
    Use the provided information from reliable automotive websites to answer the user's question.
    
    Guidelines:
    - Be specific and accurate
    - Include relevant numbers and specs
    - Mention source credibility
    - Be conversational and helpful
    - If information is incomplete, acknowledge it
    - Format key specs clearly
    
    Always cite that information comes from reputable automotive sources.`;

    const userPrompt = `User question: "${userQuery}"

Information gathered from reliable automotive websites:
${searchResult.content}

Sources: ${searchResult.sources.map(s => s.title).join(', ')}

Provide a comprehensive, accurate answer based on this information.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  }
}
```

---

### **Step 4: Update Response Handler**

Update: `packages/server/src/modules/assistant/services/response-handler.service.ts`

```typescript
import { CarSpecsSearchService } from './car-specs-search.service';

// In constructor, inject the new service
constructor(
  // ... existing dependencies
  private readonly carSpecsSearchService: CarSpecsSearchService,
) {}

// Update handleCarSpecs method
private async handleCarSpecs(
  userQuery: string,
  extractedEntities: any,
): Promise<AssistantResponseDto> {
  try {
    this.logger.log(`Handling car_specs query with web search: "${userQuery}"`);

    // Search web for car specifications
    const searchResult = await this.carSpecsSearchService.searchCarSpecs(userQuery);

    // Generate natural language response with web context
    const message = await this.carSpecsSearchService.generateResponseWithWebContext(
      userQuery,
      searchResult,
    );

    // Check if car is available in your marketplace
    const availableListings = await this.checkAvailabilityByMakeModel(
      searchResult.make,
      searchResult.model,
      searchResult.year,
    );

    // Create actions
    const actions: MessageAction[] = [];
    if (availableListings > 0) {
      actions.push({
        label: `View ${availableListings} available in stock`,
        action: 'search_listings',
        data: {
          make: searchResult.make,
          model: searchResult.model,
          year: searchResult.year,
        },
      });
    }

    // Generate suggestions
    const suggestions: SuggestionChip[] = [
      {
        id: '1',
        label: 'Compare similar cars',
        query: `Compare ${searchResult.make} ${searchResult.model} with competitors`,
        icon: '⚖️',
      },
      {
        id: '2',
        label: 'View reviews',
        query: `Show me reviews of ${searchResult.make} ${searchResult.model}`,
        icon: '⭐',
      },
      {
        id: '3',
        label: 'Check availability',
        query: `Do you have ${searchResult.make} ${searchResult.model} in stock?`,
        icon: '🚗',
      },
    ];

    return {
      intent: UserIntent.CAR_SPECS,
      message,
      data: {
        make: searchResult.make,
        model: searchResult.model,
        year: searchResult.year,
        sources: searchResult.sources,
        confidence: searchResult.confidence,
        availableInStock: availableListings > 0,
      },
      suggestions,
      actions,
    };

  } catch (error) {
    this.logger.error('Error handling car specs with web search:', error);
    return {
      intent: UserIntent.CAR_SPECS,
      message: "I'm having trouble finding detailed specifications right now. Could you try asking about a specific aspect like performance, safety features, or dimensions?",
      suggestions: [
        {
          id: '1',
          label: 'View available cars',
          query: 'What cars do you have in stock?',
          icon: '🚗',
        },
      ],
    };
  }
}

private async checkAvailabilityByMakeModel(
  make: string,
  model: string,
  year?: number,
): Promise<number> {
  const query = this.listingRepository
    .createQueryBuilder('listing')
    .innerJoin('listing.carDetail', 'car')
    .where('LOWER(car.make) = LOWER(:make)', { make })
    .andWhere('LOWER(car.model) = LOWER(:model)', { model });

  if (year) {
    query.andWhere('car.year = :year', { year });
  }

  return await query.getCount();
}
```

---

### **Step 5: Update Module Configuration**

Update: `packages/server/src/modules/assistant/assistant.module.ts`

```typescript
import { WebSearchService } from './services/web-search.service';
import { SearchQueryBuilderService } from './services/search-query-builder.service';
import { CarSpecsSearchService } from './services/car-specs-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingDetail,
      CarMetadata,
      CarMake,
      CarModel,
    ]),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    IntentClassificationService,
    QueryExtractionService,
    ListingQueryBuilderService,
    ResponseHandlerService,
    // Add new services
    WebSearchService,
    SearchQueryBuilderService,
    CarSpecsSearchService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
```

---

### **Step 6: Install Dependencies**

```bash
cd packages/server

# Install required packages
npm install cheerio
npm install @types/cheerio --save-dev
```

---

### **Step 7: Environment Configuration**

Update: `packages/server/.env`

```bash
# OpenAI (already have this)
OPENAI_API_KEY=sk-your-key-here

# Search API (Choose ONE)

# Option A: Serper API (Recommended - $5 for 2500 searches)
# Sign up: https://serper.dev/
SERPER_API_KEY=your-serper-key-here

# Option B: Google Custom Search (100 free/day)
# Setup: https://developers.google.com/custom-search
# GOOGLE_SEARCH_API_KEY=your-google-key
# GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# Option C: Bing Search API (Free tier available)
# https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
# BING_SEARCH_API_KEY=your-bing-key

# Optional: Jina AI Reader (FREE, but optional API key for higher limits)
# JINA_API_KEY=your-jina-key
```

---

## 📊 Cost Comparison

| Search API | Free Tier | Paid Cost | Best For |
|-----------|-----------|-----------|----------|
| **Serper** | $0.50 credit | $5/2500 searches | Most affordable ⭐ |
| **Google Custom Search** | 100/day | $5/1000 queries | High volume |
| **Bing Search** | Limited | Varies | Microsoft ecosystem |

**Scraping Tools:**
| Tool | Cost | Pros |
|------|------|------|
| **Jina AI Reader** | FREE | Easy, clean output ⭐ |
| **Cheerio** | FREE | Full control |
| **Puppeteer** | FREE | Handles JS sites |

---

## 🎯 Complete Flow Example

```typescript
// User asks: "What are the specs of 2024 Honda Civic?"

// 1. Extract & build search query
searchQueries = [
  "2024 Honda Civic specifications site:caranddriver.com",
  "2024 Honda Civic specs horsepower site:edmunds.com"
]

// 2. Search Google via Serper API
results = [
  { title: "2024 Honda Civic Specs", url: "caranddriver.com/...", ... },
  { title: "2024 Civic Specifications", url: "edmunds.com/...", ... },
  { title: "Honda Civic Review", url: "motortrend.com/...", ... }
]

// 3. Scrape top 3 URLs
scrapedContent = [
  {
    url: "caranddriver.com/...",
    title: "2024 Honda Civic Specs",
    content: "The 2024 Honda Civic comes with a 2.0L 4-cylinder engine producing 158 HP..."
  },
  // ... 2 more
]

// 4. Consolidate content
consolidatedText = "
  --- Source 1: 2024 Honda Civic Specs (caranddriver.com) ---
  The 2024 Honda Civic comes with a 2.0L 4-cylinder engine...
  
  --- Source 2: 2024 Civic Specifications (edmunds.com) ---
  Specifications for the 2024 Honda Civic include...
  
  --- Source 3: Honda Civic Review (motortrend.com) ---
  Motor Trend tested the 2024 Honda Civic...
"

// 5. Feed to LLM
response = LLM(
  systemPrompt: "You are a car expert...",
  context: consolidatedText,
  userQuery: "What are the specs of 2024 Honda Civic?"
)

// 6. Return formatted response to user
return {
  intent: "car_specs",
  message: "The 2024 Honda Civic offers impressive specs! It features a 2.0L...",
  data: {
    sources: [
      { title: "2024 Honda Civic Specs", url: "caranddriver.com/..." },
      { title: "2024 Civic Specifications", url: "edmunds.com/..." }
    ],
    confidence: 0.9
  },
  actions: [...],
  suggestions: [...]
}
```

---

## ✅ Advantages of This Approach

1. **Always Current** - Gets latest info from web
2. **Comprehensive** - Multiple authoritative sources
3. **Works for ANY Car** - Even brand new models
4. **Cost-Effective** - ~$0.002 per query (Serper)
5. **No API Restrictions** - Not limited to specific databases
6. **Rich Context** - Reviews, comparisons, expert opinions
7. **Source Attribution** - Shows where info came from

---

## ⚠️ Considerations

1. **Latency**: 3-5 seconds (search + scrape + LLM)
2. **Rate Limits**: Respect API limits
3. **Scraping**: Some sites may block or change structure
4. **Accuracy**: Dependent on source quality
5. **Caching**: Consider caching results for 7-30 days

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd packages/server
npm install cheerio @types/cheerio

# 2. Sign up for Serper API (recommended)
# Visit: https://serper.dev/
# Get API key (free $0.50 credit, then $5/2500 searches)

# 3. Add to .env
echo "SERPER_API_KEY=your-key-here" >> .env

# 4. Create the 3 new service files
# (Use code provided above)

# 5. Update assistant.module.ts

# 6. Start server
npm run start:dev

# 7. Test
curl -X POST http://localhost:3000/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the specs of 2024 Tesla Model 3?"}'
```

---

## 📈 Performance Optimization

### Caching Strategy
```typescript
// Cache search results for 7 days
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// Before searching, check cache
const cached = await this.cacheService.get(`car-specs:${make}:${model}:${year}`);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data;
}

// After searching, cache result
await this.cacheService.set(`car-specs:${make}:${model}:${year}`, {
  data: result,
  timestamp: Date.now(),
});
```

---

## 🎯 Summary

**Web Search Approach is PERFECT for car_specs because:**

✅ No need for dedicated car APIs  
✅ Always up-to-date information  
✅ Works for any car model  
✅ Cost-effective (~$0.002/query)  
✅ Rich, detailed information  
✅ Source attribution for credibility  

**Estimated Development Time:** 2-3 days

**Monthly Cost (1000 queries):**
- Serper API: $2
- OpenAI tokens: $3-5
- **Total: ~$5-7/month**

This is a modern, scalable solution that's used by products like Perplexity AI, ChatGPT with browsing, and other AI assistants!


