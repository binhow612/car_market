import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
  private readonly EMBEDDING_DIMENSION = 384;

  async onModuleInit() {
    this.logger.log('EmbeddingService initializing - model will be loaded on first use...');
    // Don't load the model on startup to prevent blocking server startup
    // The model will be loaded lazily when first needed
  }

  private async initializeModel(): Promise<void> {
    if (this.extractor) return;
    if (this.isInitializing && this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.isInitializing = true;
    this.initializationPromise = this._loadModel();
    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async _loadModel(): Promise<void> {
    try {
      this.logger.log(`Loading embedding model: ${this.MODEL_NAME}...`);
      const startTime = Date.now();
      
      // Add timeout to prevent hanging
      const loadPromise = pipeline('feature-extraction', this.MODEL_NAME, {
        quantized: true,
      }) as Promise<FeatureExtractionPipeline>;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Model loading timeout after 5 minutes')), 5 * 60 * 1000);
      });
      
      this.extractor = await Promise.race([loadPromise, timeoutPromise]);
      const loadTime = Date.now() - startTime;
      this.logger.log(`Embedding model loaded successfully in ${loadTime}ms`);
    } catch (error) {
      this.logger.error('Failed to load embedding model:', error);
      throw new Error(`Failed to initialize embedding service: ${error.message}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      await this.initializeModel();
      if (!this.extractor) {
        throw new Error('Embedding model not initialized');
      }
    } catch (error) {
      this.logger.warn('Embedding model failed to load, using fallback embedding');
      // Return a simple hash-based embedding as fallback
      return this.generateFallbackEmbedding(text);
    }

    try {
      const output = await this.extractor(text, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = Array.from(output.data) as number[];
      if (embedding.length !== this.EMBEDDING_DIMENSION) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    await this.initializeModel();

    this.logger.log(`Generating embeddings for ${texts.length} texts...`);
    const embeddings: number[][] = [];
    const batchSize = 32;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  getEmbeddingDimension(): number {
    return this.EMBEDDING_DIMENSION;
  }

  isModelLoaded(): boolean {
    return this.extractor !== null;
  }

  private generateFallbackEmbedding(text: string): number[] {
    // Simple hash-based embedding as fallback
    const hash = this.simpleHash(text);
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);
    
    // Distribute hash values across the embedding dimensions
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}


