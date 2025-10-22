import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmbeddingService } from '../modules/assistant/services/embedding.service';
import { ChromaDBService } from '../modules/assistant/services/chromadb.service';
import { FAQ } from '../entities/faq.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

async function regenerateFAQEmbeddings() {
  console.log('=== FAQ Embedding Regeneration Script ===\n');

  // Create NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
  const embeddingService = app.get(EmbeddingService);
  const chromaDBService = app.get(ChromaDBService);
  const dataSource = app.get(DataSource);
  const faqRepository = dataSource.getRepository(FAQ);

  try {
    // Step 1: Check current FAQs in database
    console.log('Step 1: Checking existing FAQs in database...');
    const existingFAQs = await faqRepository.count();
    console.log(`Found ${existingFAQs} existing FAQs\n`);

    if (existingFAQs > 0) {
      console.log('Step 2: Clearing old embeddings from ChromaDB...');
      await chromaDBService.clearCollection();
      console.log('✓ Old embeddings cleared from ChromaDB\n');
    }

    // Step 3: Load FAQs from CSV if database is empty
    let faqs: FAQ[] = [];
    if (existingFAQs === 0) {
      console.log('Step 3: Loading FAQs from CSV...');
      const csvPath = path.join(__dirname, '../../../../../carmarket_faqs.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found at: ${csvPath}`);
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        quote: '"',
        escape: '"',
        relax_quotes: true,
        relax_column_count: true,
      });

      console.log(`Loaded ${records.length} FAQs from CSV\n`);

      // Insert FAQs into database
      console.log('Step 4: Inserting FAQs into database...');
      for (const record of records) {
        const faq = faqRepository.create({
          category: record.Category,
          question: record.Question,
          answer: record.Answer,
          language: 'en',
          isActive: true,
          searchCount: 0,
          rating: 0,
        });
        faqs.push(faq);
      }
      await faqRepository.save(faqs);
      console.log(`✓ Inserted ${faqs.length} FAQs\n`);
    } else {
      console.log('Step 3: Loading FAQs from database...');
      faqs = await faqRepository.find({
        where: { isActive: true },
      });
      console.log(`Loaded ${faqs.length} FAQs from database\n`);
    }

    // Step 4: Initialize embedding model
    console.log('Step 4: Initializing embedding model...');
    console.log('This may take a few minutes on first run (downloading model)...');
    const testEmbedding = await embeddingService.generateEmbedding('test');
    const embeddingDimension = embeddingService.getEmbeddingDimension();
    console.log(`✓ Model loaded successfully`);
    console.log(`  Model: Xenova/all-MiniLM-L6-v2`);
    console.log(`  Dimensions: ${embeddingDimension}`);
    console.log(`  Test embedding generated: ${testEmbedding.length} dimensions\n`);

    // Step 5: Generate embeddings and store in ChromaDB
    console.log('Step 5: Generating embeddings and storing in ChromaDB...');
    console.log('This will take a few minutes...\n');

    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < faqs.length; i += batchSize) {
      const batch = faqs.slice(i, i + batchSize);
      const chromaDocuments: Array<{
        id: string;
        embedding: number[];
        metadata: any;
        document: string;
      }> = [];
      
      for (const faq of batch) {
        const text = `${faq.category}: ${faq.question}\n${faq.answer}`;
        const embedding = await embeddingService.generateEmbedding(text);
        
        // Store in ChromaDB format
        chromaDocuments.push({
          id: faq.id,
          embedding,
          metadata: {
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            language: faq.language,
            isActive: faq.isActive,
            searchCount: faq.searchCount,
            rating: faq.rating,
            createdAt: faq.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: faq.updatedAt?.toISOString() || new Date().toISOString(),
          },
          document: text,
        });
      }

      // Save batch to ChromaDB
      await chromaDBService.upsertDocuments(chromaDocuments);
      processed += batch.length;

      const progress = ((processed / faqs.length) * 100).toFixed(1);
      console.log(`Progress: ${processed}/${faqs.length} (${progress}%)`);
    }

    console.log('\n✓ All embeddings generated and stored in ChromaDB!\n');

    // Step 6: Verification
    console.log('Step 6: Verifying ChromaDB installation...');
    const totalFAQs = await faqRepository.count();
    const chromaCount = await chromaDBService.getCount();

    console.log(`Total FAQs in database: ${totalFAQs}`);
    console.log(`FAQs in ChromaDB: ${chromaCount}`);

    if (chromaCount === totalFAQs) {
      console.log('✅ All FAQs have been stored in ChromaDB!\n');
    } else {
      console.log('⚠ Some FAQs might be missing from ChromaDB\n');
    }

    // Step 7: Test vector search
    console.log('Step 7: Testing ChromaDB vector search...');
    const testQuery = 'How do I upload images?';
    const queryEmbedding = await embeddingService.generateEmbedding(testQuery);

    const results = await chromaDBService.search(queryEmbedding, 3);

    console.log(`Test query: "${testQuery}"\n`);
    console.log('Top 3 results:');
    results.forEach((result, index) => {
      const similarity = ((1 - result.distance / 2) * 100).toFixed(2);
      console.log(`${index + 1}. [${result.metadata.category}] ${result.metadata.question}`);
      console.log(`   Similarity: ${similarity}%`);
    });

    console.log('\n✅ FAQ embedding regeneration completed successfully!');
    console.log('\n💡 Your FAQ RAG system is now using ChromaDB (local) with:');
    console.log('   - Vector Database: ChromaDB (local persistent storage)');
    console.log('   - Model: all-MiniLM-L6-v2 (quantized)');
    console.log('   - Dimensions: 384');
    console.log('   - No need for pgvector extension!\n');

  } catch (error) {
    console.error('\n❌ Error during regeneration:', error);
    throw error;
  } finally {
    await app.close();
  }
}

regenerateFAQEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

