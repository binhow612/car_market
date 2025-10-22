# FAQ RAG System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│  ┌──────────────────┐                                              │
│  │  Virtual         │  User asks FAQ question                      │
│  │  Assistant UI    │  "How do I search for cars?"                 │
│  └────────┬─────────┘                                              │
│           │                                                         │
│           │ HTTP POST /assistant/query                             │
│           │                                                         │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER (NestJS)                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AssistantController                             │  │
│  │  - Handles incoming requests                                 │  │
│  │  - Authentication & authorization                            │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                          │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AssistantService                                │  │
│  │  - Main orchestration service                                │  │
│  │  - Calls intent classification                               │  │
│  │  - Routes to appropriate handler                             │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   INTENT CLASSIFICATION                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │      IntentClassificationService                             │  │
│  │                                                              │  │
│  │  ┌──────────────┐                                           │  │
│  │  │  OpenAI      │  Classify user intent                     │  │
│  │  │  GPT-3.5     │  → FAQ, CAR_LISTING, CAR_SPECS, etc.      │  │
│  │  └──────────────┘                                           │  │
│  │                                                              │  │
│  │  Output: { intent: "FAQ", confidence: 0.95 }                │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │ Intent = "FAQ"
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FAQ RAG PIPELINE                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          ResponseHandlerService.handleFAQ()                  │  │
│  │                                                              │  │
│  │  Step 1: Generate Query Embedding                           │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │         EmbeddingService                               │ │  │
│  │  │                                                        │ │  │
│  │  │  Model: paraphrase-multilingual-mpnet-base-v2         │ │  │
│  │  │  Input: "How do I search for cars?"                   │ │  │
│  │  │  Output: [0.123, -0.456, 0.789, ...] (768 dims)       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                          │                                   │  │
│  │                          ▼                                   │  │
│  │  Step 2: Vector Similarity Search                           │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │         FAQRAGService                                  │ │  │
│  │  │                                                        │ │  │
│  │  │  • Search top 4 nearest neighbors                     │ │  │
│  │  │  • Minimum similarity: 0.3                            │ │  │
│  │  │  • Apply relevance boosting                           │ │  │
│  │  │  • Cache results (LRU)                                │ │  │
│  │  └─────────────┬──────────────────────────────────────────┘ │  │
│  │                │                                             │  │
│  │                ▼                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │      PostgreSQL + pgvector                             │ │  │
│  │  │                                                        │ │  │
│  │  │  SELECT *, 1 - (embedding <=> query_vector) AS sim    │ │  │
│  │  │  FROM faqs                                             │ │  │
│  │  │  WHERE isActive = true                                 │ │  │
│  │  │  ORDER BY embedding <=> query_vector                   │ │  │
│  │  │  LIMIT 4                                               │ │  │
│  │  │                                                        │ │  │
│  │  │  Results:                                              │ │  │
│  │  │  1. FAQ [Browsing Cars] - Similarity: 0.984           │ │  │
│  │  │  2. FAQ [Search & Filters] - Similarity: 0.872        │ │  │
│  │  │  3. FAQ [Browsing Cars] - Similarity: 0.821           │ │  │
│  │  │  4. FAQ [Search & Filters] - Similarity: 0.765        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                          │                                   │  │
│  │                          ▼                                   │  │
│  │  Step 3: Build Context for LLM                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Context:                                              │ │  │
│  │  │                                                        │ │  │
│  │  │  FAQ 1 [Browsing Cars] (98.4%):                       │ │  │
│  │  │  Q: How do I search for cars?                         │ │  │
│  │  │  A: Use the search bar on the homepage...            │ │  │
│  │  │                                                        │ │  │
│  │  │  FAQ 2 [Search & Filters] (87.2%):                    │ │  │
│  │  │  Q: What filters are available?                       │ │  │
│  │  │  A: Available filters include...                      │ │  │
│  │  │                                                        │ │  │
│  │  │  ... (2 more FAQs)                                    │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                          │                                   │  │
│  │                          ▼                                   │  │
│  │  Step 4: LLM Response Generation                            │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │         OpenAI GPT-3.5                                 │ │  │
│  │  │                                                        │ │  │
│  │  │  System Prompt:                                        │ │  │
│  │  │  "You are a helpful assistant for CarMarket.          │ │  │
│  │  │   Answer based on the FAQ context below..."           │ │  │
│  │  │                                                        │ │  │
│  │  │  Context: [Top 4 FAQs]                                │ │  │
│  │  │  User Query: "How do I search for cars?"              │ │  │
│  │  │                                                        │ │  │
│  │  │  Generated Response:                                   │ │  │
│  │  │  "Searching for cars on CarMarket is easy!            │ │  │
│  │  │   Use the search bar on the homepage to search        │ │  │
│  │  │   by make, model, or keywords. You can also use       │ │  │
│  │  │   our advanced filters to narrow down results..."     │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                          │                                   │  │
│  │                          ▼                                   │  │
│  │  Step 5: Add Suggestions & Actions                          │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Suggestions: [Related FAQ questions]                  │ │  │
│  │  │  Actions: [Browse Cars button, etc.]                   │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       RESPONSE TO USER                              │
│                                                                     │
│  {                                                                  │
│    "intent": "faq",                                                 │
│    "message": "Searching for cars on CarMarket is easy! ...",      │
│    "suggestions": [...],                                            │
│    "actions": [...],                                                │
│    "data": {                                                        │
│      "retrievedFAQs": [...],                                        │
│      "searchMetadata": {...}                                        │
│    }                                                                │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Timeline

```
Time (ms)   │ Component                      │ Action
────────────┼────────────────────────────────┼──────────────────────────
0           │ Client                         │ Send query
50          │ AssistantController            │ Receive & authenticate
100         │ IntentClassificationService    │ Classify intent
1100        │ EmbeddingService               │ Generate query embedding
1250        │ FAQRAGService                  │ Vector search (top 4)
1300        │ PostgreSQL                     │ Return similar FAQs
1350        │ ResponseHandlerService         │ Build LLM context
2500        │ OpenAI GPT-3.5                 │ Generate response
2550        │ ResponseHandlerService         │ Add suggestions/actions
2600        │ AssistantController            │ Return to client
────────────┼────────────────────────────────┼──────────────────────────
Total: ~2.6 seconds (typical)
```

## Component Interactions

```
┌──────────────────┐
│  EmbeddingService│◄───┐
└──────────────────┘    │
                        │
                        │  Uses
┌──────────────────┐    │
│  FAQRAGService   │────┘
└────────┬─────────┘
         │
         │ Queries
         ▼
┌──────────────────┐
│  FAQ Entity      │
│  (PostgreSQL)    │
└──────────────────┘
         ▲
         │ Seeded by
         │
┌──────────────────┐
│  Seeder Script   │
└──────────────────┘
```

## Database Schema

```sql
┌─────────────────────────────────────────┐
│              faqs                       │
├─────────────────────────────────────────┤
│ id            UUID PRIMARY KEY          │
│ category      VARCHAR(255)              │
│ question      TEXT                      │
│ answer        TEXT                      │
│ embedding     VECTOR(768)  ◄── pgvector│
│ language      VARCHAR(10)               │
│ isActive      BOOLEAN                   │
│ searchCount   INTEGER                   │
│ rating        DECIMAL(3,2)              │
│ createdAt     TIMESTAMP                 │
│ updatedAt     TIMESTAMP                 │
└─────────────────────────────────────────┘
         │
         │ Indexed by
         ▼
┌─────────────────────────────────────────┐
│  idx_faqs_embedding (IVFFlat)           │
│  - Type: vector_cosine_ops              │
│  - Lists: 100                           │
│  - For fast similarity search           │
└─────────────────────────────────────────┘
```

## Vector Search Process

```
1. Query Embedding
   ┌─────────────────────────────────────┐
   │ "How do I search for cars?"         │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ Embedding Model                     │
   │ paraphrase-multilingual-mpnet-base  │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ [0.123, -0.456, 0.789, ...]         │
   │ 768-dimensional vector              │
   └──────────────┬──────────────────────┘

2. Similarity Search
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ PostgreSQL + pgvector               │
   │                                     │
   │ For each FAQ:                       │
   │   similarity = 1 - cosine_distance  │
   │                                     │
   │ Sort by similarity DESC             │
   │ Filter where similarity >= 0.3      │
   │ LIMIT 4                             │
   └──────────────┬──────────────────────┘

3. Relevance Boosting
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ boost = 1.0                         │
   │ if keyword_match: boost *= 1.2      │
   │ if high_rating: boost *= 1.05       │
   │ if popular: boost *= 1.03           │
   │                                     │
   │ relevance = similarity * boost      │
   └──────────────┬──────────────────────┘

4. Top-K Results
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ FAQ 1: relevance = 0.984            │
   │ FAQ 2: relevance = 0.872            │
   │ FAQ 3: relevance = 0.821            │
   │ FAQ 4: relevance = 0.765            │
   └─────────────────────────────────────┘
```

## Caching Strategy

```
┌──────────────────────────────────────────┐
│           Query Cache (LRU)              │
├──────────────────────────────────────────┤
│  Key: "query|topK|minSimilarity"         │
│  Value: FAQSearchResult[]                │
│  Size: 100 queries                       │
│  Eviction: Least Recently Used           │
└──────────────┬───────────────────────────┘
               │
               │ Cache Hit?
               │
         ┌─────┴─────┐
         │           │
        Yes          No
         │           │
         ▼           ▼
    Return      Perform
    Cached      Vector
    Results     Search
                     │
                     └──► Cache Result
```

## Error Handling Flow

```
┌──────────────────────────────────────────┐
│         Normal Flow                      │
└──────────────┬───────────────────────────┘
               │
               ▼
         Try Vector Search
               │
        ┌──────┴──────┐
        │             │
    Success       Error
        │             │
        │             ▼
        │      ┌──────────────────┐
        │      │ Fallback:        │
        │      │ Keyword Search   │
        │      └──────┬───────────┘
        │             │
        ▼             ▼
    ┌─────────────────────┐
    │ LLM Generation      │
    └──────┬──────────────┘
           │
    ┌──────┴──────┐
    │             │
Success       Error
    │             │
    │             ▼
    │      ┌──────────────────┐
    │      │ Fallback:        │
    │      │ Generic Response │
    │      └──────────────────┘
    │
    ▼
Return to User
```

## Deployment Architecture

```
┌───────────────────────────────────────────────┐
│              Load Balancer                    │
└───────────────┬───────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│   Server 1   │  │   Server 2   │
│              │  │              │
│  - NestJS    │  │  - NestJS    │
│  - Services  │  │  - Services  │
│  - Model     │  │  - Model     │
│    Cache     │  │    Cache     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
    ┌─────────────────────┐
    │   PostgreSQL        │
    │   + pgvector        │
    │                     │
    │   - FAQs            │
    │   - Vector Index    │
    └─────────────────────┘
```

## File Organization

```
packages/server/src/
│
├── entities/
│   └── faq.entity.ts                 # FAQ data model with vectors
│
├── modules/
│   └── assistant/
│       ├── assistant.module.ts       # Module registration
│       ├── assistant.service.ts      # Main service
│       ├── assistant.controller.ts   # API endpoints
│       │
│       └── services/
│           ├── embedding.service.ts          # Vector embeddings
│           ├── faq-rag.service.ts            # RAG retrieval
│           ├── intent-classification.service # Intent detection
│           └── response-handler.service.ts   # Response generation
│
└── scripts/
    └── seed-faq-embeddings.ts        # Data seeder
```

---

## Key Design Decisions

### Why pgvector?
- ✅ Already using PostgreSQL
- ✅ ACID compliance
- ✅ No additional infrastructure
- ✅ Good performance for <1M vectors
- ✅ Easy backup and replication

### Why paraphrase-multilingual-mpnet-base-v2?
- ✅ Multilingual (EN/VI support)
- ✅ 768 dimensions (standard)
- ✅ State-of-the-art accuracy
- ✅ Can run locally (no API calls)
- ✅ Open source

### Why Top-4 Retrieval?
- ✅ Balances context richness vs noise
- ✅ Fits within LLM context window
- ✅ Good accuracy vs performance
- ✅ Industry standard for RAG

### Why LRU Cache?
- ✅ Simple and effective
- ✅ No external dependencies
- ✅ Good hit rate for FAQ patterns
- ✅ Automatic memory management

---

**This architecture provides a robust, scalable, and maintainable FAQ RAG system with production-grade reliability.**

