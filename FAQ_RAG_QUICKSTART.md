# FAQ RAG System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
cd CarMarket-master/packages/server
npm install
```

This installs:
- `@xenova/transformers` - Multilingual embedding model
- `pgvector` - PostgreSQL vector extension
- `csv-parse` - CSV file parsing

### Step 2: Setup PostgreSQL with pgvector

#### Option A: Using Docker (Recommended)

```bash
# Use PostgreSQL with pgvector pre-installed
docker run -d \
  --name carmarket-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=carmarket \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

#### Option B: Install pgvector manually

```bash
# Ubuntu/Debian
sudo apt install postgresql-15-pgvector

# Mac
brew install pgvector
```

Then enable the extension:
```sql
CREATE EXTENSION vector;
```

### Step 3: Configure Environment

Create `packages/server/.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=carmarket

# OpenAI API Key (required for LLM)
OPENAI_API_KEY=sk-your-openai-api-key

# Server
PORT=3000
NODE_ENV=development
```

**Get OpenAI API Key**: https://platform.openai.com/api-keys

### Step 4: Seed FAQ Data

```bash
npm run seed:faq
```

This will:
1. ✅ Create FAQ table with vector column
2. ✅ Load 149 FAQs from CSV
3. ✅ Generate 768-dim embeddings
4. ✅ Create vector indexes
5. ✅ Verify with test search

**Expected time**: 1-2 minutes (first run downloads model ~500MB)

### Step 5: Start the Server

```bash
npm run start:dev
```

## 🧪 Test the System

### Option 1: Using the Virtual Assistant UI

1. Start the client:
```bash
cd packages/client
npm run dev
```

2. Open http://localhost:5173
3. Click the blue chat bubble (bottom-right)
4. Ask: "How do I search for cars?"

### Option 2: Using cURL

```bash
# Login first (get access token)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}'

# Query the assistant
curl -X POST http://localhost:3000/assistant/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"How do I search for cars?"}'
```

### Option 3: Test Queries

Try these questions:
- ✅ "How do I search for cars?"
- ✅ "What filters are available?"
- ✅ "How do I sell my car?"
- ✅ "Can I save cars to favorites?"
- ✅ "How do I contact a seller?"
- ✅ "What payment methods are accepted?"
- ✅ "How do I create an account?"

## 📊 Verify Installation

### Check FAQ Count

```sql
SELECT COUNT(*) as total_faqs,
       COUNT(embedding) as faqs_with_embeddings
FROM faqs;
```

Expected: 149 FAQs, all with embeddings

### Check Vector Index

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'faqs';
```

Should show `idx_faqs_embedding` with ivfflat type

### Test Vector Search

```sql
-- Get a sample embedding
SELECT embedding FROM faqs LIMIT 1;

-- Test similarity search (use the embedding from above)
SELECT question, 
       1 - (embedding <=> (SELECT embedding FROM faqs LIMIT 1)) as similarity
FROM faqs
ORDER BY embedding <=> (SELECT embedding FROM faqs LIMIT 1)
LIMIT 5;
```

## 🔧 Configuration

### Adjust RAG Parameters

Edit `packages/server/src/modules/assistant/services/faq-rag.service.ts`:

```typescript
// Number of FAQs to retrieve
private readonly DEFAULT_TOP_K = 4;  // Change to 5, 6, etc.

// Minimum similarity threshold (0.0 - 1.0)
private readonly MIN_SIMILARITY_THRESHOLD = 0.3;  // Lower = more permissive

// Cache settings
private readonly CACHE_SIZE = 100;
```

### Use Different Embedding Model

Edit `packages/server/src/modules/assistant/services/embedding.service.ts`:

```typescript
// Current: paraphrase-multilingual-mpnet-base-v2 (768 dims)
private readonly MODEL_NAME = 'Xenova/paraphrase-multilingual-mpnet-base-v2';

// Alternative models (all 768 dims):
// - 'Xenova/all-mpnet-base-v2'  // English only, faster
// - 'Xenova/multilingual-e5-base'  // Better multilingual
```

**Note**: If you change the model, re-run the seeder!

## 🐛 Troubleshooting

### Error: "Cannot find module '@xenova/transformers'"

```bash
cd packages/server
npm install @xenova/transformers pgvector csv-parse
```

### Error: "Extension vector does not exist"

```sql
CREATE EXTENSION vector;
```

If still fails, install pgvector:
```bash
# Docker
docker exec -it carmarket-postgres psql -U postgres -d carmarket -c "CREATE EXTENSION vector;"

# Local
psql -U postgres -d carmarket -c "CREATE EXTENSION vector;"
```

### Error: "OPENAI_API_KEY not found"

1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env`:
```
OPENAI_API_KEY=sk-...
```
3. Restart server

### Slow Embedding Generation

**First run**: Model downloads (~500MB), takes 2-3 minutes  
**Subsequent runs**: Model cached, takes 30-60 seconds

**To check model cache**:
```bash
ls -lh ~/.cache/huggingface/hub/
```

### Poor Search Results

**Adjust similarity threshold**:
```typescript
// Lower threshold = more results, less precise
MIN_SIMILARITY_THRESHOLD = 0.2  // vs 0.3

// Higher threshold = fewer results, more precise  
MIN_SIMILARITY_THRESHOLD = 0.5
```

**Increase results**:
```typescript
DEFAULT_TOP_K = 6  // vs 4
```

## 📈 Performance Optimization

### 1. Enable Query Caching

Already enabled by default! Cache stats:
```typescript
// Check cache hit rate in logs
[FAQRAGService] Returning cached results
```

### 2. Optimize Vector Index

For better search performance with large datasets:

```sql
-- Increase lists for larger datasets
DROP INDEX idx_faqs_embedding;
CREATE INDEX idx_faqs_embedding 
ON faqs USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);  -- vs 100
```

### 3. Database Connection Pooling

Already configured in TypeORM! Check:
```typescript
// packages/server/src/config/database.config.ts
poolSize: 10,
connectionTimeoutMillis: 5000,
```

## 📚 Next Steps

1. **Add More FAQs**: Edit `carmarket_faqs.csv` and re-run seeder
2. **Customize Responses**: Edit `response-handler.service.ts`
3. **Add Analytics**: Track popular FAQs, search patterns
4. **Multi-language**: Add Vietnamese FAQs to CSV
5. **Feedback Loop**: Collect user ratings, improve FAQs

## 🎯 Example Workflow

### Adding New FAQs

1. **Edit CSV**:
```csv
Category,Question,Answer
New Category,New question?,New answer here.
```

2. **Re-seed**:
```bash
npm run seed:faq
```

3. **Test**:
```bash
curl -X POST http://localhost:3000/assistant/query \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"New question?"}'
```

### Monitoring Performance

```bash
# Watch server logs
npm run start:dev | grep FAQ

# Look for:
[FAQRAGService] Found 4 relevant FAQs in 45ms (avg similarity: 0.823)
[ResponseHandlerService] Generated response in 1250ms
```

### Clearing Cache

```bash
# Restart server (clears in-memory cache)
# Or add an admin endpoint:

GET /api/admin/faq/clear-cache
```

## 🔐 Security Notes

1. **API Keys**: Never commit `.env` to git
2. **Rate Limiting**: Consider adding for production
3. **Input Validation**: Already handled in services
4. **SQL Injection**: TypeORM prevents this

## 💡 Tips

- **First query is slow**: Model loads on first use (~2s), then fast
- **Similar questions**: System handles variations well
- **Multilingual**: Works with English and Vietnamese
- **Synonyms**: Model understands semantic similarity
- **Context**: System provides 4 FAQs for better context

## 📞 Support

**Check logs**:
```bash
tail -f logs/application.log
```

**Common log entries**:
- `[EmbeddingService] Loading embedding model...` - First startup
- `[FAQRAGService] Searching FAQs for query` - Search initiated
- `[ResponseHandlerService] Processing FAQ query with RAG` - RAG pipeline

**Need help?**
1. Read `FAQ_RAG_IMPLEMENTATION.md` for details
2. Check error logs
3. Verify database connection
4. Test with simple queries first

---

**Ready to go!** 🎉

Your FAQ RAG system is now set up and ready to provide intelligent, context-aware answers to user questions.

