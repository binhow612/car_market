# Virtual Assistant Implementation Guide

## Overview

The Virtual Assistant feature uses OpenAI's GPT-3.5 to intelligently classify user intents and provide contextual responses. The system categorizes user queries into 4 main intents and provides relevant information from your car marketplace database.

## Architecture

### Backend (NestJS)

```
packages/server/src/modules/assistant/
├── dto/
│   ├── assistant-query.dto.ts       # Request DTO
│   └── assistant-response.dto.ts    # Response DTOs and types
├── services/
│   ├── intent-classification.service.ts  # LLM-based intent classification
│   └── response-handler.service.ts       # Intent-specific response handlers
├── assistant.controller.ts          # REST API endpoints
├── assistant.service.ts             # Main orchestration service
└── assistant.module.ts              # Module configuration
```

### Frontend (React)

```
packages/client/src/
├── services/
│   └── assistant.service.ts         # API integration service
└── types/
    └── assistant.types.ts           # TypeScript types
```

## Intent Classification

The system uses OpenAI's GPT-3.5 to classify user queries into 4 intents:

### 1. **car_specs** 
Questions about car specifications, features, or technical details

**Examples:**
- "What are the specs of Honda Civic?"
- "Tell me about BMW X5 features"
- "What's the fuel efficiency of Toyota Camry?"

**Response:** Provides detailed car specifications using database metadata and general knowledge

### 2. **car_listing**
Questions about cars available for sale in the marketplace

**Examples:**
- "What cars do you have?"
- "Show me available SUVs"
- "Do you have any Honda cars in stock?"

**Response:** Queries the database for available listings and displays results with actions

### 3. **faq**
Questions about the shop, services, policies, or buying process

**Examples:**
- "What are your business hours?"
- "Do you offer financing?"
- "How do I buy a car?"
- "What's your return policy?"

**Response:** Provides helpful information about marketplace operations

### 4. **car_compare**
Requests to compare two or more different cars

**Examples:**
- "Compare Honda Civic vs Toyota Corolla"
- "Which is better: BMW X5 or Mercedes GLE?"
- "Civic vs Accord differences"

**Response:** Provides detailed comparison covering specs, features, pros/cons

## Setup Instructions

### 1. Install Dependencies

The OpenAI SDK is already installed. If needed, run:

```bash
cd packages/server
npm install openai
```

### 2. Configure OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:

```bash
# packages/server/.env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Start the Server

```bash
cd packages/server
npm run start:dev
```

## API Endpoints

### GET `/assistant/welcome`
Get the welcome message when assistant is first opened

**Response:**
```json
{
  "intent": null,
  "message": "👋 Hi! I'm your car marketplace assistant...",
  "suggestions": [
    {
      "id": "1",
      "label": "Show available cars",
      "query": "What cars do you have available?",
      "icon": "🚗"
    }
  ]
}
```

### POST `/assistant/query`
Send a user query and get an intelligent response

**Request:**
```json
{
  "query": "What are the specs of Honda Civic?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "intent": "car_specs",
  "message": "The Honda Civic is a compact sedan with...",
  "data": { /* Optional data payload */ },
  "suggestions": [
    {
      "id": "1",
      "label": "View available cars",
      "query": "What cars do you have available?",
      "icon": "🚗"
    }
  ],
  "actions": [
    {
      "label": "View Listing",
      "action": "view_listing",
      "data": { "listingId": "123" }
    }
  ]
}
```

## Frontend Integration

### Using the Assistant Service

```typescript
import { AssistantService } from '../services/assistant.service';

// Get welcome message
const welcome = await AssistantService.getWelcomeMessage();

// Send a query
const response = await AssistantService.sendQuery(
  "What cars do you have available?"
);

// Convert to message format
const message = AssistantService.convertToMessage(response);

// Handle actions
response.actions?.forEach(action => {
  AssistantService.handleMessageAction(action);
});
```

## Implementation Details

### Intent Classification Process

1. **User sends query** → Controller receives request
2. **Intent Classification** → OpenAI analyzes query and returns intent + entities
3. **Response Generation** → Intent-specific handler processes the request
4. **Data Retrieval** → Queries database for relevant information
5. **LLM Response** → OpenAI generates natural language response with context
6. **Return to User** → Structured response with suggestions and actions

### Key Features

✅ **LLM-based Intent Classification** - More accurate than rule-based systems
✅ **Context-Aware Responses** - Uses actual database data for relevant answers
✅ **Entity Extraction** - Identifies car makes, models, and features from queries
✅ **Suggestion Chips** - Provides follow-up questions to guide users
✅ **Action Buttons** - Direct links to view listings or perform actions
✅ **Fallback Handling** - Graceful error handling with helpful messages

### Database Integration

The assistant queries these entities:
- `ListingDetail` - Available cars for sale
- `CarMetadata` - Car specifications and features
- `CarMake` & `CarModel` - Supported makes and models

### Cost Optimization

- Uses **GPT-3.5-turbo** (cost-effective)
- Low temperature (0.3) for intent classification
- Token limits to control costs
- JSON response format for structured output

## Testing

### Example Queries

**Car Specs:**
```
"What are the features of BMW X5?"
"Tell me about Honda Civic specifications"
```

**Car Listing:**
```
"Show me available SUVs"
"What Honda cars do you have in stock?"
```

**FAQ:**
```
"How do I buy a car from you?"
"Do you offer financing options?"
```

**Car Compare:**
```
"Compare Honda Civic and Toyota Corolla"
"BMW X5 vs Mercedes GLE comparison"
```

## Customization

### Modify Intent Classification

Edit `packages/server/src/modules/assistant/services/intent-classification.service.ts`:

```typescript
const systemPrompt = `Your custom prompt here...`;
```

### Add New Response Logic

Edit `packages/server/src/modules/assistant/services/response-handler.service.ts`:

```typescript
private async handleCarSpecs(...) {
  // Add your custom logic
}
```

### Change OpenAI Model

Update model in service files:

```typescript
model: 'gpt-4', // or 'gpt-3.5-turbo'
```

## Troubleshooting

### Issue: "OPENAI_API_KEY not found"
**Solution:** Add the API key to your `.env` file

### Issue: Rate limit errors
**Solution:** Add retry logic or implement caching

### Issue: Slow responses
**Solution:** Consider caching common queries or using streaming

## Next Steps

1. ✅ Backend implementation complete
2. ✅ Frontend service created
3. 🔄 UI/UX already implemented (as mentioned by user)
4. ⏭️ Test the integration
5. ⏭️ Add conversation history storage
6. ⏭️ Implement caching for common queries
7. ⏭️ Add analytics to track query patterns

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-3.5 Turbo Guide](https://platform.openai.com/docs/guides/gpt)
- [Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

