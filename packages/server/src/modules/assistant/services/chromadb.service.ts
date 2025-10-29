import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from '../../../entities/faq.entity';

export interface ChromaDocument {
  id: string;
  embedding: number[];
  metadata: {
    category: string;
    question: string;
    answer: string;
    language: string;
    isActive: boolean;
    searchCount: number;
    rating: number;
    createdAt: string;
    updatedAt: string;
  };
  document: string;
}

export interface SearchResult {
  id: string;
  distance: number;
  metadata: ChromaDocument['metadata'];
  document: string;
}

@Injectable()
export class ChromaDBService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChromaDBService.name);
  private isInitialized = false;

  constructor(
    @InjectRepository(FAQ)
    private faqRepository: Repository<FAQ>,
  ) {}

  async onModuleInit() {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error('Failed to initialize vector storage on module init:', error);
      // Don't throw - allow lazy initialization on first use
    }
  }

  async onModuleDestroy() {
    this.logger.log('Vector storage service shutting down');
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.logger.log('Initializing vector storage (PostgreSQL)...');
      
      // Just verify database connection
      await this.faqRepository.count();

      this.isInitialized = true;
      this.logger.log(`Vector storage initialized successfully (using PostgreSQL)`);
    } catch (error) {
      this.logger.error('Failed to initialize vector storage:', error);
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Add or update documents (store embeddings in PostgreSQL)
   */
  async upsertDocuments(documents: ChromaDocument[]): Promise<void> {
    await this.ensureInitialized();

    if (documents.length === 0) {
      this.logger.warn('No documents to upsert');
      return;
    }

    try {
      // Update FAQs with their embeddings
      for (const doc of documents) {
        await this.faqRepository.update(
          { id: doc.id },
          { embedding: doc.embedding }
        );
      }

      this.logger.log(`Upserted ${documents.length} embeddings to PostgreSQL`);
    } catch (error) {
      this.logger.error('Failed to upsert documents:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents using cosine similarity in PostgreSQL
   */
  async search(
    queryEmbedding: number[],
    topK: number = 4,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    await this.ensureInitialized();

    try {
      // Build query with optional filters
      let queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.embedding IS NOT NULL')
        .andWhere('faq.isActive = :isActive', { isActive: true });

      if (filter) {
        if (filter.language) {
          queryBuilder = queryBuilder.andWhere('faq.language = :language', { language: filter.language });
        }
        if (filter.category) {
          queryBuilder = queryBuilder.andWhere('faq.category = :category', { category: filter.category });
        }
      }

      const faqs = await queryBuilder.getMany();

      // Calculate cosine similarity for each FAQ
      const results = faqs.map(faq => {
        const similarity = this.cosineSimilarity(queryEmbedding, faq.embedding);
        return {
          id: faq.id,
          distance: 1 - similarity, // Convert similarity to distance
          metadata: {
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            language: faq.language,
            isActive: faq.isActive,
            searchCount: faq.searchCount,
            rating: parseFloat(faq.rating?.toString() || '0'),
            createdAt: faq.createdAt.toISOString(),
            updatedAt: faq.updatedAt.toISOString(),
          },
          document: `${faq.question}\n${faq.answer}`,
        };
      });

      // Sort by distance (lower is better) and take top K
      results.sort((a, b) => a.distance - b.distance);
      return results.slice(0, topK);
    } catch (error) {
      this.logger.error('Failed to search embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(
    vecA: number[] | null | undefined,
    vecB: number[] | null | undefined,
  ): number {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    const length = Math.min(vecA.length, vecB.length);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      const a = vecA[i] ?? 0;
      const b = vecB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<ChromaDocument | null> {
    await this.ensureInitialized();

    try {
      const faq = await this.faqRepository.findOne({ where: { id } });

      if (!faq) {
        return null;
      }

      return {
        id: faq.id,
        embedding: faq.embedding || [],
        metadata: {
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          language: faq.language,
          isActive: faq.isActive,
          searchCount: faq.searchCount,
          rating: parseFloat(faq.rating?.toString() || '0'),
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        },
        document: `${faq.question}\n${faq.answer}`,
      };
    } catch (error) {
      this.logger.error('Failed to get document:', error);
      return null;
    }
  }

  /**
   * Delete documents by IDs (clear embeddings)
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.ensureInitialized();

    try {
      // Set embeddings to null for these FAQs
      await this.faqRepository
        .createQueryBuilder()
        .update(FAQ)
        .set({ embedding: () => 'NULL' })
        .whereInIds(ids)
        .execute();
      this.logger.log(`Cleared ${ids.length} embeddings from PostgreSQL`);
    } catch (error) {
      this.logger.error('Failed to delete documents:', error);
      throw error;
    }
  }

  /**
   * Clear all embeddings from the database
   */
  async clearCollection(): Promise<void> {
    await this.ensureInitialized();

    try {
      // Clear all embeddings
      await this.faqRepository
        .createQueryBuilder()
        .update(FAQ)
        .set({ embedding: () => 'NULL' })
        .execute();
      this.logger.log('All embeddings cleared from PostgreSQL');
    } catch (error) {
      this.logger.error('Failed to clear collection:', error);
      throw error;
    }
  }

  /**
   * Get the total count of documents with embeddings
   */
  async getCount(): Promise<number> {
    await this.ensureInitialized();

    try {
      const count = await this.faqRepository.createQueryBuilder('faq')
        .where('faq.embedding IS NOT NULL')
        .getCount();
      return count;
    } catch (error) {
      this.logger.error('Failed to get document count:', error);
      return 0;
    }
  }

  /**
   * Update metadata for a document
   */
  async updateMetadata(id: string, metadata: Partial<ChromaDocument['metadata']>): Promise<void> {
    await this.ensureInitialized();

    try {
      // Update FAQ fields from metadata
      const updateData: any = {};
      if (metadata.category !== undefined) updateData.category = metadata.category;
      if (metadata.question !== undefined) updateData.question = metadata.question;
      if (metadata.answer !== undefined) updateData.answer = metadata.answer;
      if (metadata.language !== undefined) updateData.language = metadata.language;
      if (metadata.isActive !== undefined) updateData.isActive = metadata.isActive;
      if (metadata.searchCount !== undefined) updateData.searchCount = metadata.searchCount;
      if (metadata.rating !== undefined) updateData.rating = metadata.rating;

      await this.faqRepository.update({ id }, updateData);

      this.logger.log(`Updated metadata for document ${id}`);
    } catch (error) {
      this.logger.error('Failed to update metadata:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

