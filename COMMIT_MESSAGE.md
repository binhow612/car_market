feat: Implement intelligent recommendation system with user behavior tracking

Add a comprehensive recommendation system that provides personalized car
recommendations based on user preferences, search history, and viewing behavior.

## Features

### Core Recommendation Engine
- Hybrid scoring algorithm combining multiple factors:
  - Content-based matching (make, model, body type) - 70% weight
  - Search history analysis - 30% weight (when available)
  - View history tracking - 40% weight (when available)
  - Location-based scoring - 10% weight
  - Popularity metrics - 10% weight
  - Price affinity - 10% weight
- Priority system: Make + Model match > Make match > Body type match
- Limit recommendations to 3 items for better UX

### User Behavior Tracking
- Search history tracking: Records user search queries and filters
- View history tracking: Tracks listing views, view duration, and user actions
  - Regular views
  - Long views (>30 seconds)
  - Contact clicks
  - Favorite clicks
- Automatic cache invalidation when user behavior changes

### Database Schema
- `user_recommendations`: Stores cached recommendations with scores and reasons
- `user_search_history`: Tracks user search queries and filters
- `user_view_history`: Tracks user viewing behavior and interactions

### API Endpoints
- `GET /recommendations`: Get personalized recommendations (requires auth)
- `GET /recommendations/similar/:listingId`: Get similar listings
- Search endpoint automatically saves search history for authenticated users

### Frontend Components
- `RecommendationsSection`: Displays personalized recommendations on homepage
- `SimilarCarsSection`: Shows similar cars on listing detail page
- Both components limit display to 3 items without showing reasons

### Technical Implementation
- Database-backed caching with transaction-safe upsert operations
- Optional authentication support for search and listing views
- Time-decay scoring for view history (recent views weighted higher)
- Duplicate prevention for view tracking (1-minute window)
- Graceful error handling and fallbacks

## Database Changes
- New tables: `user_recommendations`, `user_search_history`, `user_view_history`
- Indexes added for performance optimization
- Proper foreign key constraints and cascading deletes

## Breaking Changes
None - This is a new feature addition.
