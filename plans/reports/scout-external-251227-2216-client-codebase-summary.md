# Client Codebase Architecture Summary
**Date:** 2025-12-27  
**Path:** `packages/client/src`

## Overview
React 19 + TypeScript + Vite frontend for Car Marketplace. 168 TS/TSX files (~33K LOC). Monorepo package with shared backend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19.1.1 + Vite 7.1.2 |
| Language | TypeScript 5.8.3 (relaxed config) |
| State | Zustand 5.0.8 (persist middleware) |
| Routing | React Router DOM 7.8.2 |
| Styling | Tailwind CSS 4.1.12 + Vite plugin |
| UI | Radix UI primitives (dialog, select, tabs) |
| Forms | React Hook Form 7.62.0 + Zod 4.1.5 |
| HTTP | Axios 1.11.0 |
| Real-time | Socket.IO Client 4.8.1 |
| Maps | Leaflet + React-Leaflet + Clustering |
| Charts | Recharts 3.5.0 |
| Animations | GSAP 3.13.0, @dnd-kit (drag-drop) |
| 3D | Three.js + React Three Fiber/Drei |
| Notifications | React Hot Toast 2.6.0 |

---

## Directory Structure

```
src/
├── assets/              # Static assets (images, svgs)
├── components/          # 48+ components (see below)
│   ├── __tests__/      # Component tests
│   ├── charts/         # Chart components (4)
│   ├── comments/       # Comment system (5)
│   ├── dashboard/      # Dashboard layout (5)
│   ├── listings/       # Listing-specific (1)
│   ├── monitoring/     # Real-time monitoring (4)
│   ├── promotions/     # Promotion UI (3)
│   ├── ratings/        # Rating components (3)
│   ├── seller/         # Seller trust/badges (3)
│   ├── settings/       # Settings sections (9)
│   └── ui/             # Base UI components (12)
├── config/             # Assistant config
├── constants/          # Metric tooltips
├── contexts/           # React contexts (3)
├── examples/           # Example components
├── hooks/              # Custom hooks (2)
├── lib/                # API client, constants
├── pages/              # Route pages (28)
│   └── dashboards/     # Role-based dashboards (4)
├── services/           # API services (26)
├── store/              # Zustand stores (1)
├── test/               # Test setup
├── types/              # TypeScript definitions (5)
└── utils/              # Utility functions (3)
```

---

## Routing Structure

**Entry:** `main.tsx` -> `App.tsx` -> `Layout.tsx`

### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | HomePage | Main listing feed |
| `/search` | SearchPage | Advanced search with filters |
| `/login` | LoginPage | OAuth + email login |
| `/register` | RegisterPage | User registration |
| `/cars/:id` | CarDetailsPage | Listing details |
| `/users/:id` | UserProfilePage | Public user profiles |
| `/valuation` | CarValuationPage | AI car valuation |
| `/privacy` | PrivacyPolicyPage | Privacy policy |

### Protected Routes
| Path | Page | Permission |
|------|------|------------|
| `/sell-car` | SellCarPage | `listing:create` |
| `/edit-listing/:id` | EditListingPage | `listing:update` |
| `/profile` | ProfilePage | Auth required |
| `/verify-seller` | SellerVerificationPage | Auth required |
| `/become-seller` | BecomeSellerPage | Auth required |
| `/my-listings` | MyListingsPage | Auth required |
| `/favorites` | FavoritesPage | Auth required |
| `/conversations` | ConversationsListPage | Auth required |
| `/chat/:conversationId` | ChatPage | Auth required |
| `/notifications` | NotificationsPage | Auth required |
| `/notifications/preferences` | NotificationPreferencesPage | Auth required |
| `/settings` | SettingsPage | Auth required |
| `/promotions/:id/pay` | PaymentPage | Auth required |
| `/promotions/:id/payment/:status` | PaymentCallbackPage | Auth required |

### Admin Routes
| Path | Page | Access |
|------|------|--------|
| `/admin/dashboard` | EnhancedAdminDashboard | Admin role |
| `/dashboard/super-admin` | SuperAdminDashboard | `super_admin` role |
| `/dashboard/admin` | AdminDashboard | `admin`/`super_admin` |
| `/dashboard/moderator` | ModeratorDashboard | `moderator`+ |
| `/dashboard/seller` | SellerDashboard | `dashboard:seller` |

### Callback Routes
- `/auth/callback` - OAuth callbacks
- `/promotions/payos-callback` - Payment gateway
- `/promotions/momo-callback` - MoMo payment
- `/promotions/vnpay-callback` - VNPay payment

---

## State Management

### Zustand Store (`store/auth.ts`)
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  permissions: string[]  // From JWT
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
```

**Actions:** `login`, `register`, `becomeSeller`, `logout`, `updateUser`, `initialize`

**Persistence:** LocalStorage via `persist` middleware (key: `auth-storage`)

---

## Context Providers

### 1. NotificationContext
**Location:** `contexts/NotificationContext.tsx`

**State:**
- `chatUnreadCount` - Chat messages unread
- `notificationUnreadCount` - Notifications unread
- `conversations` - User's conversations
- `notifications` - Notification list

**Socket Events:**
- `globalNotification` - Listing approved/rejected
- `newNotification` - New notification
- `notificationUpdate` - Read/deleted
- `notificationUnreadCountUpdate` - Count sync
- `chatUnreadCountUpdate` - Chat count sync
- `missedNotifications` - Offline catch-up

**Refresh:** Every 30s

### 2. SocketContext
**Location:** `contexts/SocketContext.tsx`

**Features:**
- Auto-connect on auth
- Auto-disconnect on logout
- Force logout handling (admin role revocation)
- Session validity check (30s interval)
- Connection status tracking

### 3. AssistantContext
**Location:** `contexts/AssistantContext.tsx`

**State:**
- `isOpen`, `isMinimized` - UI state
- `messages` - Chat history
- `isTyping` - Typing indicator
- `unreadCount` - Unread messages
- `notificationCount` - Approval notifications

**Guest Mode:** localStorage persistence via `ChatbotStorageService`

**Sync:** Auto-syncs guest messages on login

---

## Key Components

### Authentication
| File | Purpose |
|------|---------|
| `ProtectedRoute.tsx` | Permission-based route guards |
| `PublicRoute.tsx` | Redirect authenticated users |
| `AdminRoute.tsx` | Admin-only routes |
| `PermissionGate.tsx` | Conditional UI rendering |

### Listing UI
| File | Purpose |
|------|---------|
| `CarCard.tsx` | Listing card (16KB) |
| `CarValuation.tsx` | AI valuation widget |
| `ValuationForm.tsx` | Valuation input form |
| `DraggableImageGallery.tsx` | Image reordering |
| `LocationPicker.tsx` | Map-based location |
| `ListingMap.tsx` | Leaflet map with markers |
| `MapView.tsx` | Full map view |
| `SimilarCarsSection.tsx` | Recommendations |

### Verification
| File | Purpose |
|------|---------|
| `BasicVerificationModal.tsx` | Basic tier (9KB) |
| `StandardVerificationModal.tsx` | Standard tier (12KB) |
| `PremiumVerificationModal.tsx` | Premium tier (17KB) |
| `VerificationStatusCard.tsx` | Status display |
| `VerificationLevelCard.tsx` | Level selector |
| `ViewEditBasicModal.tsx` | Edit basic |
| `ViewEditStandardModal.tsx` | Edit standard |
| `ViewEditPremiumModal.tsx` | Edit premium |

### Features
| Category | Components |
|----------|------------|
| Comments | `CommentForm`, `CommentItem`, `CommentList`, `CommentReactions`, `ReportCommentDialog` |
| Ratings | `RatingDisplay`, `RatingForm`, `RatingList` |
| Promotions | `PromoteListingDialog`, `PromotionBadge`, `PromotionPricingCard` |
| Dashboard | `DashboardLayout`, `SidebarLayout`, `MetricCard`, `ChartCard`, `TimeRangeSelector` |
| Monitoring | `RealtimeActivityPanel`, `RealtimeMetricCard`, `ApiActivityChart`, `ActiveUsersList` |
| Charts | `BarChart`, `LineChart`, `AreaChart`, `PieChart` |
| Seller | `TrustBadges`, `SellerStats`, `QuickContactCard` |
| Settings | 9 role-specific sections |

### Base UI (`ui/`)
12 components: `Avatar`, `Badge`, `Button`, `Card`, `Dialog`, `DualRangeSlider`, `EnhancedSelect`, `Input`, `Select`, `Table`, `Tabs`, `Tooltip`

---

## Services Layer (26 files)

### Core Services
| File | Purpose |
|------|---------|
| `api.ts` | Axios wrapper (interceptors, auth) |
| `socket.service.ts` | Socket.IO manager (3 namespaces) |

### Business Services
| File | Endpoints |
|------|-----------|
| `listing.service.ts` | Listings CRUD, search, nearby |
| `profile.service.ts` | User profiles, avatar upload |
| `favorites.service.ts` | Favorites CRUD |
| `chat.service.ts` | Conversations, messages |
| `comment.service.ts` | Comments CRUD, reactions |
| `rating.service.ts` | Seller ratings |
| `notification.service.ts` | Notifications CRUD |
| `promotion.service.ts` | Listing promotions |
| `seller-verification.service.ts` | Verification tiers |
| `metadata.service.ts` | Car makes/models/features |
| `valuation.service.ts` | Car valuation |

### Admin Services
| File | Purpose |
|------|---------|
| `admin.service.ts` | Admin dashboard data |
| `analytics.service.ts` | Analytics metrics |
| `rbac.service.ts` | Role/permission management |
| `logs.service.ts` | System logs |
| `monitoring.service.ts` | Real-time monitoring |

### Integration Services
| File | Purpose |
|------|---------|
| `assistant.service.ts` | AI chatbot |
| `chatbot-storage.service.ts` | Guest chat persistence |
| `geocoding.service.ts` | Location services |
| `push-notification.service.ts` | Push notifications |
| `recommendations.service.ts` | Car recommendations |
| `settings.service.ts` | User settings |

---

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `usePermissions` | Check user permissions/roles |
| `useNotifications` | Access notification context |

---

## Type Definitions (`types/`)

| File | Exports |
|------|---------|
| `index.ts` | Core types (User, Listing, Search, Auth, Rating, Promotion) |
| `assistant.types.ts` | Message, Action, AssistantState |
| `comment.types.ts` | Comment, Reaction, Event types |
| `settings.types.ts` | Settings interfaces |
| `car-comparison.types.ts` | Comparison types |

---

## Utilities (`utils/`)

| File | Purpose |
|------|---------|
| `jwt-utils.ts` | JWT parsing (roles, permissions) |
| `display.util.ts` | Format helpers (price, date) |
| `role-utils.ts` | Role checking helpers |

---

## Styling Approach

### Tailwind CSS 4
- **Build:** Vite plugin (`@tailwindcss/vite`)
- **Config:** Minimal (no `tailwind.config.js` - CSS-first)
- **Imports:** `@import "tailwindcss"` in `index.css`

### Key Styles (`index.css`)
- Font: Inter (Google Fonts)
- Leaflet maps styles
- Typing indicator animation
- Toast close button styling

### Component Styling
- **Utility-first:** Tailwind classes on components
- **Variants:** `class-variance-authority` + `clsx` + `tailwind-merge`
- **Radix UI:** Base primitives with Tailwind overlays

---

## Key Patterns

### 1. Permission-Based Access Control
```typescript
// Route level
<ProtectedRoute requirePermission="listing:create">
  <SellCarPage />
</ProtectedRoute>

// Component level
<PermissionGate permission="admin:dashboard">
  <AdminButton />
</PermissionGate>
```

### 2. Service Layer Pattern
All API calls through static service methods:
```typescript
const listing = await ListingService.getListing(id);
const results = await ListingService.searchListings(filters);
```

### 3. Error Boundaries
```typescript
<ErrorBoundary>
  <SellerVerificationPage />
</ErrorBoundary>
```

### 4. Toast Notifications
```typescript
import toast from "react-hot-toast";
toast.success("Message sent!");
toast.error("Operation failed", { icon: "❌" });
```

### 5. Socket Namespaces
- `/chat` - Messaging
- `/comments` - Real-time comments
- `/notifications` - Push notifications

---

## Configuration

### Environment Variables
```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### TypeScript Config
- **Target:** ES2022
- **Module:** ESNext (bundler mode)
- **Strictness:** Relaxed (disabled for build speed)
- **JSX:** `react-jsx` (new transform)

### Vite Config
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

---

## Testing

### Test Setup
- **Framework:** Vitest
- **Library:** @testing-library/react
- **Location:** `test/setup.ts`

### Component Tests
- `components/__tests__/NotificationBell.test.tsx`
- `services/__tests__/notification.service.test.ts`

---

## Dependencies Summary

### Production (32)
- React ecosystem (react, react-dom, react-router-dom)
- UI (tailwind, radix-ui, lucide-react)
- Forms (react-hook-form, zod, @hookform/resolvers)
- Data (axios, zustand, recharts)
- Real-time (socket.io-client)
- Maps (leaflet, react-leaflet)
- 3D (three, @react-three/fiber, @react-three/drei)
- Drag-drop (@dnd-kit)
- Animations (gsap)

### Development (13)
- Vite + plugins
- TypeScript + ESLint
- Vitest + testing-library
- Tailwind CSS (v4)

---

## Important Files

| File | Lines | Purpose |
|------|-------|---------|
| `App.tsx` | 300 | Route definitions, providers |
| `store/auth.ts` | 237 | Auth state management |
| `lib/api.ts` | 125 | HTTP client setup |
| `contexts/NotificationContext.tsx` | 309 | Notification state + sockets |
| `contexts/SocketContext.tsx` | 152 | Socket connection mgmt |
| `contexts/AssistantContext.tsx` | 523 | AI chatbot state |

---

## Unresolved Questions

- Q: Why relaxed TypeScript config (strict: false)?  
  A: Likely for faster iteration/migration

- Q: Guest chat storage sync edge cases?  
  A: Partial sync handling exists but may need testing

- Q: Socket reconnection strategy?  
  A: Built-in Socket.IO reconnection + custom heartbeat

