import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from '../../../entities/faq.entity';
import { EmbeddingService } from './embedding.service';
import { ChromaDBService } from './chromadb.service';

export interface FAQSearchResult {
  faq: FAQ;
  similarity: number;
  relevanceScore: number;
}

@Injectable()
export class FAQRAGService {
  private readonly logger = new Logger(FAQRAGService.name);
  private queryCache = new Map<string, FAQSearchResult[]>();
  private readonly CACHE_SIZE = 100;
  private readonly DEFAULT_TOP_K = 3;
  private readonly MIN_SIMILARITY_THRESHOLD = 0.3;
  private readonly RELEVANCE_BOOST = {
    exactMatch: 1.2,
    categoryMatch: 1.1,
    highRating: 1.05,
  };

  constructor(
    @InjectRepository(FAQ)
    private readonly faqRepository: Repository<FAQ>,
    private readonly embeddingService: EmbeddingService,
    private readonly chromaDBService: ChromaDBService,
  ) {}

  async searchFAQs(
    query: string,
    topK: number = this.DEFAULT_TOP_K,
    minSimilarity: number = this.MIN_SIMILARITY_THRESHOLD,
  ): Promise<FAQSearchResult[]> {
    try {
      this.logger.log(`Searching FAQs for query: "${query}" (top-${topK})`);
      const cacheKey = `${query.toLowerCase().trim()}|${topK}|${minSimilarity}`;
      const cached = this.queryCache.get(cacheKey);
      if (cached) {
        this.logger.log('Returning cached results');
        return cached;
      }

      // Check if ChromaDB is ready
      if (!this.chromaDBService.isReady()) {
        this.logger.warn('ChromaDB not ready, using fallback keyword search');
        return this.fallbackKeywordSearch(query, topK);
      }

      // Generate query embedding (model will be loaded on first use)
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search in ChromaDB
      const chromaResults = await this.chromaDBService.search(
        queryEmbedding,
        topK * 2,
        { isActive: true }
      );

      // Convert ChromaDB results to FAQSearchResult format
      const results: FAQSearchResult[] = chromaResults
        .map((result) => {
          // ChromaDB returns distance (lower is better), convert to similarity (higher is better)
          // Distance is typically 0-2 for cosine distance, so similarity = 1 - (distance / 2)
          const similarity = 1 - (result.distance / 2);
          
          return {
            faq: {
              id: result.id,
              category: result.metadata.category,
              question: result.metadata.question,
              answer: result.metadata.answer,
              embedding: [],
              language: result.metadata.language,
              isActive: result.metadata.isActive,
              searchCount: result.metadata.searchCount,
              rating: result.metadata.rating,
              createdAt: new Date(result.metadata.createdAt),
              updatedAt: new Date(result.metadata.updatedAt),
            } as FAQ,
            similarity,
            relevanceScore: similarity,
          };
        })
        .filter((result) => result.similarity >= minSimilarity);

      const boostedResults = this.applyRelevanceBoost(results, query);
      boostedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const finalResults = boostedResults.slice(0, topK);

      this.updateAnalytics(finalResults).catch((err) =>
        this.logger.error('Failed to update analytics:', err)
      );

      if (this.queryCache.size >= this.CACHE_SIZE) {
        const firstKey = this.queryCache.keys().next().value;
        this.queryCache.delete(firstKey);
      }
      this.queryCache.set(cacheKey, finalResults);

      this.logger.log(`Found ${finalResults.length} relevant FAQs`);
      return finalResults;
    } catch (error) {
      this.logger.error('Error searching FAQs:', error);
      return this.fallbackKeywordSearch(query, topK);
    }
  }

  private applyRelevanceBoost(results: FAQSearchResult[], query: string): FAQSearchResult[] {
    const queryLower = query.toLowerCase().trim();
    return results.map((result) => {
      let boost = 1.0;
      const questionLower = result.faq.question.toLowerCase();
      const answerLower = result.faq.answer.toLowerCase();

      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
      const matchingWords = queryWords.filter(
        word => questionLower.includes(word) || answerLower.includes(word)
      );
      if (matchingWords.length > 0) {
        boost *= Math.pow(this.RELEVANCE_BOOST.exactMatch, matchingWords.length);
      }

      if (result.faq.rating && result.faq.rating >= 4.0) {
        boost *= this.RELEVANCE_BOOST.highRating;
      }

      if (result.faq.searchCount > 10) {
        boost *= 1.03;
      }

      result.relevanceScore = result.similarity * boost;
      return result;
    });
  }

  private async fallbackKeywordSearch(query: string, topK: number): Promise<FAQSearchResult[]> {
    this.logger.warn('Using fallback keyword search');
    try {
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (keywords.length === 0) return [];

      let queryBuilder = this.faqRepository
        .createQueryBuilder('faq')
        .where('faq.isActive = :isActive', { isActive: true });

      keywords.forEach((keyword, index) => {
        const param = `keyword${index}`;
        queryBuilder = queryBuilder.orWhere(
          `(LOWER(faq.question) LIKE :${param} OR LOWER(faq.answer) LIKE :${param})`,
          { [param]: `%${keyword}%` }
        );
      });

      const faqs = await queryBuilder
        .orderBy('faq.searchCount', 'DESC')
        .addOrderBy('faq.rating', 'DESC')
        .limit(topK)
        .getMany();

      return faqs.map((faq, index) => ({
        faq,
        similarity: 0.5 - (index * 0.05),
        relevanceScore: 0.5 - (index * 0.05),
      }));
    } catch (error) {
      this.logger.error('Fallback search failed:', error);
      return [];
    }
  }

  private async updateAnalytics(results: FAQSearchResult[]): Promise<void> {
    if (results.length === 0) return;
    try {
      const faqIds = results.map(r => r.faq.id);
      await this.faqRepository
        .createQueryBuilder()
        .update(FAQ)
        .set({ searchCount: () => 'searchCount + 1' })
        .whereInIds(faqIds)
        .execute();
    } catch (error) {
      this.logger.error('Failed to update analytics:', error);
    }
  }

  clearCache(): void {
    this.queryCache.clear();
    this.logger.log('Query cache cleared');
  }
}


