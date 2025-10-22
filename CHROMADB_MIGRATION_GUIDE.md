# ChromaDB Migration Guide

## Overview

Successfully migrated the FAQ embedding system from **pgvector** to **ChromaDB** (local). This eliminates the need to install the pgvector PostgreSQL extension while maintaining all RAG functionality.

## What Changed

### 1. Vector Database
- **Before**: PostgreSQL with pgvector extension
- **After**: ChromaDB with local persistent storage

### 2. Data Storage
- **Before**: Embeddings stored in PostgreSQL `faqs` table
- **After**: Embeddings stored in ChromaDB collection (local file system)
- **Location**: `packages/server/chroma_data/`

### 3. Dependencies Added
```json
"chromadb": "^1.8.1"
```

## Files Modified

### New Files Created
1. **`packages/server/src/modules/assistant/services/chromadb.service.ts`**
   - ChromaDB client wrapper
   - Handles vector storage and similarity search
   - Manages local persistent storage

### Modified Files
1. **`packages/server/package.json`**
   - Added chromadb dependency

2. **`packages/server/src/modules/assistant/services/faq-rag.service.ts`**
   - Updated to use ChromaDB instead of pgvector queries
   - Maintains same search interface
   - Converts ChromaDB distance to similarity scores

3. **`packages/server/src/scripts/regenerate-faq-embeddings.ts`**
   - Stores embeddings in ChromaDB collection
   - Removed pgvector extension checks
   - Tests ChromaDB vector search

4. **`packages/server/src/modules/assistant/assistant.module.ts`**
   - Added ChromaDBService to providers and exports

## Installation Steps

### 1. Install Dependencies
```bash
cd packages/server
npm install
```

This will install the new `chromadb` package (v1.8.1).

### 2. Regenerate FAQ Embeddings
Run the script to populate ChromaDB with FAQ embeddings:

```bash
npm run regenerate:faq
```

This will:
- Load FAQs from database
- Generate embeddings using all-MiniLM-L6-v2 model
- Store embeddings in ChromaDB local storage
- Create ChromaDB collection at `packages/server/chroma_data/`
- Verify installation and test search

### 3. Start the Server
```bash
npm run start:dev
```

The FAQ RAG system will now use ChromaDB for vector search.

## Key Features

### ChromaDBService API

```typescript
// Search for similar FAQs
await chromaDBService.search(queryEmbedding, topK, filter);

// Add/update documents
await chromaDBService.upsertDocuments(documents);

// Get document by ID
await chromaDBService.getDocument(id);

// Delete documents
await chromaDBService.deleteDocuments(ids);

// Clear entire collection
await chromaDBService.clearCollection();

// Get total count
await chromaDBService.getCount();

// Update metadata
await chromaDBService.updateMetadata(id, metadata);
```

### Benefits of ChromaDB

1. **No PostgreSQL Extension Required**: No need to install pgvector
2. **Local Storage**: Data persists locally in `chroma_data/` folder
3. **Easy Setup**: Works out of the box after npm install
4. **Good Performance**: Efficient HNSW indexing for similarity search
5. **Flexible Metadata**: Store rich metadata alongside embeddings
6. **Type Safety**: Full TypeScript support

## Data Structure

### ChromaDB Document Format
```typescript
{
  id: string;              // FAQ UUID
  embedding: number[];     // 384-dim vector
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
  document: string;        // Full text for reference
}
```

## Search Flow

1. User asks a question
2. Question → Embedding (384-dim vector)
3. ChromaDB searches similar vectors using cosine distance
4. Results converted: `similarity = 1 - (distance / 2)`
5. Results filtered by minimum similarity threshold (0.3)
6. Relevance boosting applied (exact match, rating, etc.)
7. Top K results returned

## Troubleshooting

### ChromaDB Data Not Found
If the server can't find ChromaDB data:
```bash
npm run regenerate:faq
```

### Clear and Rebuild
To completely reset ChromaDB:
1. Delete the `packages/server/chroma_data/` folder
2. Run `npm run regenerate:faq`

### Check Collection Status
The regenerate script shows:
- Total FAQs in database
- FAQs in ChromaDB
- Test search results

## Migration Notes

### PostgreSQL Table
The `faqs` table still exists in PostgreSQL but:
- The `embedding` column is no longer used for search
- Can be set to NULL or removed in future migration
- FAQ metadata (question, answer, category) still stored in PostgreSQL
- ChromaDB is the source of truth for embeddings

### Backward Compatibility
- Same search interface in FAQRAGService
- Fallback to keyword search if ChromaDB unavailable
- Existing API endpoints unchanged

## Performance

- **Model**: Xenova/all-MiniLM-L6-v2 (quantized)
- **Dimensions**: 384
- **Search**: ~50-100ms for similarity search
- **Storage**: ~1.5KB per FAQ (embedding + metadata)

## Next Steps

Consider:
1. Adding monitoring for ChromaDB health
2. Implementing backup strategy for `chroma_data/`
3. Adding admin endpoint to rebuild ChromaDB on demand
4. Removing unused `embedding` column from PostgreSQL (optional)

## Support

If you encounter issues:
1. Check ChromaDB logs in console
2. Verify `chroma_data/` folder exists and has write permissions
3. Ensure embedding service is properly initialized
4. Run regenerate script to rebuild collection

