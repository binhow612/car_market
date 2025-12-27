# Server Codebase Structure Summary

**Date:** 2025-12-27
**Location:** packages/server/src
**Framework:** NestJS + TypeScript + PostgreSQL

## Quick Stats
- **Entities:** 42 TypeORM entities
- **Modules:** 22 feature modules
- **Controllers:** 22 controllers
- **Services:** 40+ services
- **DTOs:** 30+ data transfer objects
- **API Endpoints:** ~160 REST + WebSocket events
- **Guards:** 8 auth/RBAC guards
- **Interceptors:** 4 logging/audit interceptors
- **Migrations:** 10+ migration files
- **Scripts:** 10 seed/maintenance scripts

---

## Database Schema (42 Entities)

### Core Entities
- User, UserRole, UserSettings, UserSearchHistory, UserViewHistory, UserRecommendation
- CarMake, CarModel, CarDetail, CarImage, CarVideo, CarMetadata, CarValuationMetadata
- ListingDetail, ListingPendingChanges, ListingPromotion, PromotionPricing, Transaction
- ChatConversation, ChatMessage, ChatbotConversation, ChatbotMessage
- ListingComment, CommentReaction, CommentReport
- Notification, NotificationPreference, NotificationDeliveryLog
- Role, Permission, AuditLog, ActivityLog
- SellerRating, SellerVerification, SellerVerificationDocument, PhoneVerificationOtp
- Favorite, FAQ

---

## Modules (22)

| Module | Controller | Key Services | Endpoints |
|--------|-----------|--------------|-----------|
| auth | /api/auth | AuthService | 12 |
| users | /api/users | UsersService | 9 |
| listings | /api/listings | ListingsService | 15 |
| search | /api/search | SearchService | 2 |
| metadata | /api/metadata | MetadataService | 26 |
| favorites | /api/favorites | FavoritesService | 4 |
| chat | /api/chat | ChatService + ChatGateway | 7 + WS |
| comments | /api/comments | CommentsService | 13 |
| ratings | /api/ratings | RatingsService | 6 |
| notifications | /api/notifications | 6 notification services | 9 |
| rbac | /api/rbac | PermissionService, AuditService | 12 |
| admin | /api/admin | AdminService | 23 |
| analytics | /api/analytics | AnalyticsService | 7 |
| monitoring | /api/monitoring | RealtimeMetricsService | 6 |
| logs | /api/logs | LogsService | 2 |
| assistant | /api/assistant | 9 AI/ML services | 4 |
| recommendations | /api/recommendations | RecommendationsService | 3 |
| geocoding | /api/geocoding | GeocodingService | - |
| seller-verification | /api/seller-verification | SellerVerificationService, OtpService, SmsService | 9 |
| promotions | /api/promotions | PromotionsService | 6 |
| payment | /api/payment | PaymentService, PayosService | 2 |
| valuation | /api/valuation | ValuationService | 1 |
| settings | /api/settings | SettingsService | 3 |
| redis | - | RedisService | - |

---

## Key Files

- `/packages/server/src/main.ts` - Bootstrap entry point
- `/packages/server/src/app.module.ts` - Root module
- `/packages/server/src/config/database.config.ts` - DB config (all 42 entities)
- `/packages/server/src/entities/*.entity.ts` - Database schema
- `/packages/server/src/modules/*/` - Feature modules
- `/packages/server/src/common/` - Shared infrastructure

---

**Full report saved to:** plans/reports/scout-external-251227-2216-server-codebase-summary.md

---

## Detailed File Structure

```
packages/server/src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
│
├── config/
│   ├── database.config.ts         # TypeORM with 42 entities
│   └── data-source.ts             # Migration source
│
├── entities/ (42 files)
│   ├── user.entity.ts
│   ├── user-role.entity.ts
│   ├── user-settings.entity.ts
│   ├── user-search-history.entity.ts
│   ├── user-view-history.entity.ts
│   ├── user-recommendation.entity.ts
│   ├── car-make.entity.ts
│   ├── car-model.entity.ts
│   ├── car-detail.entity.ts
│   ├── car-image.entity.ts
│   ├── car-video.entity.ts
│   ├── car-metadata.entity.ts
│   ├── car-valuation-metadata.entity.ts
│   ├── listing-detail.entity.ts
│   ├── listing-pending-changes.entity.ts
│   ├── listing-promotion.entity.ts
│   ├── promotion-pricing.entity.ts
│   ├── transaction.entity.ts
│   ├── chat-conversation.entity.ts
│   ├── chat-message.entity.ts
│   ├── chatbot-conversation.entity.ts
│   ├── chatbot-message.entity.ts
│   ├── listing-comment.entity.ts
│   ├── comment-reaction.entity.ts
│   ├── comment-report.entity.ts
│   ├── notification.entity.ts
│   ├── notification-preference.entity.ts
│   ├── notification-delivery-log.entity.ts
│   ├── role.entity.ts
│   ├── permission.entity.ts
│   ├── audit-log.entity.ts
│   ├── activity-log.entity.ts
│   ├── seller-rating.entity.ts
│   ├── seller-verification.entity.ts
│   ├── seller-verification-document.entity.ts
│   ├── phone-verification-otp.entity.ts
│   ├── favorite.entity.ts
│   ├── faq.entity.ts
│
├── modules/ (22 modules)
│   ├── admin/
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   └── admin.notifications.spec.ts
│   ├── analytics/
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.service.spec.ts
│   │   ├── analytics.module.ts
│   │   └── dto/analytics.dto.ts
│   ├── assistant/
│   │   ├── assistant.controller.ts
│   │   ├── assistant.service.ts
│   │   ├── assistant.module.ts
│   │   ├── dto/
│   │   │   ├── assistant-query.dto.ts
│   │   │   ├── assistant-response.dto.ts
│   │   │   ├── sync-messages.dto.ts
│   │   │   ├── car-comparison.dto.ts
│   │   │   └── listing-query-params.dto.ts
│   │   └── services/
│   │       ├── car-comparison.service.ts
│   │       ├── chromadb.service.ts
│   │       ├── embedding.service.ts
│   │       ├── faq-rag.service.ts
│   │       ├── intent-classification.service.ts
│   │       ├── listing-query-builder.service.ts
│   │       ├── query-extraction.service.ts
│   │       ├── response-handler.service.ts
│   │       └── user-context.service.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── interfaces/
│   │       ├── auth-response.interface.ts
│   │       └── jwt-payload.interface.ts
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.module.ts
│   │   ├── chat.notifications.spec.ts
│   │   └── guards/
│   │       └── ws-jwt.guard.ts
│   ├── comments/
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   ├── comments.module.ts
│   │   └── dto/
│   │       ├── create-comment.dto.ts
│   │       ├── update-comment.dto.ts
│   │       ├── comment-query.dto.ts
│   │       ├── add-reaction.dto.ts
│   │       ├── report-comment.dto.ts
│   │       └── admin.dto.ts
│   ├── favorites/
│   │   ├── favorites.controller.ts
│   │   ├── favorites.service.ts
│   │   └── favorites.module.ts
│   ├── geocoding/
│   │   ├── geocoding.controller.ts
│   │   ├── geocoding.service.ts
│   │   └── geocoding.module.ts
│   ├── listings/
│   │   ├── listings.controller.ts
│   │   ├── listings.service.ts
│   │   ├── listings.module.ts
│   │   └── dto/
│   │       ├── create-listing.dto.ts
│   │       ├── update-listing.dto.ts
│   │       └── mark-as-sold.dto.ts
│   ├── logs/
│   │   ├── logs.controller.ts
│   │   ├── logs.service.ts
│   │   └── logs.module.ts
│   ├── metadata/
│   │   ├── metadata.controller.ts
│   │   ├── metadata.service.ts
│   │   └── metadata.module.ts
│   ├── monitoring/
│   │   ├── monitoring.controller.ts
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.interceptor.ts
│   │   ├── realtime-metrics.service.ts
│   │   └── dto/
│   │       └── monitoring.dto.ts
│   ├── notifications/
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.module.ts
│   │   ├── notification-cache.service.ts
│   │   ├── notification-delivery.service.ts
│   │   ├── notification-metrics.service.ts
│   │   ├── notification-preferences.service.ts
│   │   ├── notification-retry.service.ts
│   │   └── channels/
│   │       ├── email-notification.service.ts
│   │       └── push-notification.service.ts
│   ├── payment/
│   │   ├── payment.controller.ts
│   │   ├── payment.service.ts
│   │   ├── payos.service.ts
│   │   └── payment.module.ts
│   ├── promotions/
│   │   ├── promotions.controller.ts
│   │   ├── promotions.service.ts
│   │   ├── promotions.module.ts
│   │   └── dto/
│   │       └── create-promotion.dto.ts
│   ├── ratings/
│   │   ├── ratings.controller.ts
│   │   ├── ratings.service.ts
│   │   ├── ratings.module.ts
│   │   └── dto/
│   │       ├── create-rating.dto.ts
│   │       ├── update-rating.dto.ts
│   │       └── rating-query.dto.ts
│   ├── rbac/
│   │   ├── rbac.controller.ts
│   │   ├── permission.service.ts
│   │   ├── audit.service.ts
│   │   └── rbac.module.ts
│   ├── recommendations/
│   │   ├── recommendations.controller.ts
│   │   ├── recommendations.service.ts
│   │   ├── recommendations.module.ts
│   │   └── dto/
│   │       └── recommendation-query.dto.ts
│   ├── redis/
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   ├── search/
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   ├── search.module.ts
│   │   └── dto/
│   │       └── search-filters.dto.ts
│   ├── seller-verification/
│   │   ├── seller-verification.controller.ts
│   │   ├── seller-verification.service.ts
│   │   ├── seller-verification.module.ts
│   │   ├── dto/
│   │   │   ├── submit-verification.dto.ts
│   │   │   ├── review-verification.dto.ts
│   │   │   └── verify-phone.dto.ts
│   │   └── services/
│   │       ├── otp.service.ts
│   │       └── sms.service.ts
│   ├── settings/
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   ├── settings.module.ts
│   │   └── dto/
│   │       └── update-settings.dto.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       └── change-password.dto.ts
│   └── valuation/
│       ├── valuation.controller.ts
│       ├── valuation.service.ts
│       └── valuation.module.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── permission.decorator.ts
│   │   ├── resource.decorator.ts
│   │   └── log-action.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   ├── optional-jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── permission.guard.ts
│   │   ├── resource.guard.ts
│   │   ├── google-auth.guard.ts
│   │   └── facebook-auth.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── audit.interceptor.ts
│   │   ├── action-logging.interceptor.ts
│   │   └── role-validation.interceptor.ts
│   ├── filters/
│   │   ├── logging-exception.filter.ts
│   │   └── rbac.filter.ts
│   └── middleware/
│       └── rate-limit.middleware.ts
│
├── migrations/ (10 files)
│   ├── 001-create-rbac-tables.ts
│   ├── 002-add-notification-fields.ts
│   ├── 002-add-notification-fields.sql
│   ├── 003-seed-super-admin-moderator.ts
│   ├── 003-seed-super-admin-moderator.sql
│   ├── 004-create-faqs-table.ts
│   └── 005-add-pg-trgm.ts
│
├── scripts/ (10 files)
│   ├── run-migrations.ts
│   ├── run-init-sql.ts
│   ├── migrate-legacy-roles.ts
│   ├── run-rbac-seed.ts
│   ├── setup-rbac.ts
│   ├── seed-valuation-metadata.ts
│   ├── regenerate-faq-embeddings.ts
│   ├── rbac-seed.ts
│   └── run-legacy-roles-migration.ts
│
└── utils/
    └── value-comparison.util.ts
```

---

## Entity Relationships Summary

### User Center
- `User` has many `ListingDetail` (as seller)
- `User` has many `UserRole`
- `User` has many `SellerRating` (received and given)
- `User` has many `Transaction` (as seller)
- `User` has many `Favorite`
- `User` has many `ChatConversation` (as buyer and seller)
- `User` has many `Notification`
- `User` has many `UserSettings`
- `User` has many `ActivityLog`, `AuditLog`

### Listing Center
- `ListingDetail` belongs to `User` (seller)
- `ListingDetail` has one `CarDetail`
- `ListingDetail` has many `ListingPendingChanges`
- `ListingDetail` has many `ListingPromotion`
- `ListingDetail` has many `ListingComment`
- `ListingDetail` has many `Transaction`

### RBAC Center
- `Role` has many `Permission` (many-to-many)
- `Role` has many `UserRole`
- `Permission` has many `Role` (many-to-many)

---

## Key Architectural Patterns

### 1. Module Pattern
Each feature is a self-contained NestJS module:
- Controller (HTTP routes)
- Service (business logic)
- DTOs (validation)
- Module (dependencies)

### 2. RBAC System
- Roles: USER, SELLER, MODERATOR, ADMIN, SUPER_ADMIN
- Permissions: CREATE/READ/UPDATE/DELETE/MANAGE on resources
- Guards: RolesGuard, PermissionGuard, ResourceGuard
- Decorators: @Roles(), @Permission(), @Resource()

### 3. Multi-channel Authentication
- Local (email/password)
- Google OAuth
- Facebook OAuth
- JWT tokens with session validation

### 4. Real-time Communication
- Socket.IO gateway at `/chat` namespace
- Room-based messaging: `user:{userId}`, `conversation:{conversationId}`
- WebSocket JWT auth via WsJwtGuard

### 5. Notification System
- Multiple channels: Email (Nodemailer), Push (Firebase FCM)
- Preferences per user/channel/type
- Delivery tracking and retry logic
- Caching layer via Redis

### 6. Audit Trail
- ActivityLog: High-level user actions
- AuditLog: Detailed RBAC changes
- Auto-logged via @LogAction decorator

### 7. AI/Assistant Integration
- ChromaDB for vector storage (FAQ RAG)
- OpenAI for embeddings
- Intent classification
- Query extraction for car search
- Car comparison service

### 8. File Upload
- Multer for handling multipart/form-data
- Stored in `/uploads/` directory
- Served as static files
- Avatar uploads for users
- Car images/videos for listings

---

## Environment Variables (Required)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=carmarket_user
DATABASE_PASSWORD=carmarket_password
DATABASE_NAME=carmarket

# Server
PORT=3000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# OAuth (Facebook)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase (Push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS (Twilio or similar)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (PayOS)
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# OpenAI (Assistant)
OPENAI_API_KEY=your-openai-key
```

---

## Common Infrastructure (Detailed)

### Guards Usage
```typescript
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@UseGuards(PermissionGuard)
@Permission(PermissionAction.UPDATE, PermissionResource.LISTING)
```

### Decorators Usage
```typescript
@CurrentUser() user: User           // Get authenticated user
@Public()                            // Bypass JWT auth
@Roles('ADMIN')                      // Require role
@Permission('UPDATE', 'LISTING')     // Require permission
@Resource('listing')                 // Resource ownership check
@LogAction({...})                    // Log activity
```

### Interceptors Chain
1. MonitoringInterceptor (performance)
2. LoggingInterceptor (request/response)
3. AuditInterceptor (audit trail)
4. ActionLoggingInterceptor (specific actions)

### Exception Handling
- LoggingExceptionFilter catches all exceptions
- Logs error with context
- Returns standardized error response
- RbacFilter handles RBAC-specific errors

---

## NPM Scripts (package.json)

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "migration:generate": "npm run typeorm -- migration:generate -d src/config/data-source.ts",
  "migration:run": "npm run typeorm -- migration:run -d src/config/data-source.ts",
  "migration:revert": "npm run typeorm -- migration:revert -d src/config/data-source.ts",
  "import:car-data": "ts-node -r tsconfig-paths/register src/scripts/import-car-data.ts",
  "regenerate:faq": "ts-node -r tsconfig-paths/register src/scripts/regenerate-faq-embeddings.ts",
  "seed:rbac": "ts-node -r tsconfig-paths/register src/scripts/run-rbac-seed.ts",
  "setup:rbac": "ts-node -r tsconfig-paths/register src/scripts/setup-rbac.ts",
  "seed:valuation": "ts-node -r tsconfig-paths/register src/scripts/seed-valuation-metadata.ts",
  "run:init-sql": "ts-node -r tsconfig-paths/register src/scripts/run-init-sql.ts",
  "db:setup:full": "npm run run:init-sql && npm run migration:run && npm run seed:rbac"
}
```

---

## Unresolved Questions

1. **Payment Gateway:** PayOS integration - are there other payment methods?
2. **SMS Provider:** Which SMS service for OTP (Twilio, AWS SNS, etc.)?
3. **Email Provider:** SMTP configuration details?
4. **Firebase:** Full FCM configuration for push notifications?
5. **ChromaDB:** Local instance or remote cloud hosting?
6. **OpenAI:** Which model used for assistant? Rate limits?
7. **Rate Limiting:** Specific rules per endpoint?
8. **Test Coverage:** Current test coverage percentage?
9. **Deployment:** Vercel serverless configuration details?
10. **Monitoring:** External monitoring service (Sentry, DataDog, etc.)?

