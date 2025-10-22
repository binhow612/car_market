# Car Market 🚗

A modern full-stack marketplace for buying and selling used cars.

## Tech Stack

**Frontend:** React + TypeScript + Tailwind CSS + Vite  
**Backend:** NestJS + TypeScript + PostgreSQL + JWT Auth  
**Database:** PostgreSQL + Redis (Docker)

## Quick Start

### 1. Setup

```bash
npm install
npm run db:up
```

### 2. Environment Files

Create these files with your settings:

- `packages/server/.env` (copy from `packages/server/env.example`)
- `packages/client/.env` (copy from `packages/client/env.example`)

### 3. Seed Initial Data

After starting the server, seed the car metadata (requires admin token):

```bash
curl -X POST http://localhost:3000/api/metadata/seed
```

### 4. Run Development

**Option A: Both together**

```bash
npm run dev
```

**Option B: Separate terminals**

```bash
# Terminal 1
npm run server

# Terminal 2
npm run client
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api
- **Database**: localhost:5432

## Available Commands

```bash
npm run dev      # Start both client & server
npm run client   # Start frontend only
npm run server   # Start backend only
npm run build    # Build both for production
npm run db:up    # Start database
npm run db:down  # Stop database
```

## Features

- 🔐 **Authentication**: Register, login, password reset with JWT
- 👤 **User Profiles**: Complete profile management with avatar upload
- 🚗 **Car Listings**: Create, edit, delete listings with image support
- 🔍 **Advanced Search**: Filter by make, model, price, fuel type, body type
- ❤️ **Favorites System**: Save and manage favorite listings
- 🛡️ **Admin Panel**: Metadata management and listing approval workflow
- 📊 **Dynamic Data**: All car data managed through database (no hardcoded values)
- 📱 **Responsive Design**: Modern UI with Tailwind CSS v4
- 🔄 **Real-time Updates**: User-friendly notifications and data updates

## Project Structure

```
carmarket/
├── packages/
│   ├── client/     # React frontend
│   └── server/     # NestJS backend
├── docker-compose.yml
└── package.json
```

## API Endpoints

**Authentication:**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset

**Profile Management:**

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile information
- `POST /api/users/upload-avatar` - Upload profile avatar
- `POST /api/users/change-password` - Change password

**Listings:**

- `GET /api/listings` - Get all approved listings
- `GET /api/listings/:id` - Get listing details
- `POST /api/listings` - Create new listing
- `PATCH /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/upload-images` - Upload car images
- `GET /api/search` - Search with filters

**Favorites:**

- `POST /api/favorites/:listingId` - Add listing to favorites
- `DELETE /api/favorites/:listingId` - Remove from favorites
- `GET /api/favorites` - Get user's favorite listings
- `GET /api/favorites/check/:listingId` - Check if listing is favorited

**Chat System:**

- `POST /api/chat/start/:listingId` - Start conversation about listing
- `POST /api/chat/:conversationId/messages` - Send message
- `GET /api/chat/:conversationId` - Get conversation with messages
- `GET /api/chat` - Get user's conversations
- `POST /api/chat/:conversationId/read` - Mark messages as read

**Car Metadata:**

- `GET /api/metadata/all` - Get all car metadata (fuel types, body types, etc.)
- `GET /api/metadata/makes` - Get all car makes
- `GET /api/metadata/makes/:id/models` - Get models for a specific make
- `GET /api/metadata/fuel-types` - Get fuel types
- `GET /api/metadata/body-types` - Get body types
- `GET /api/metadata/car-features` - Get available car features

**Admin (Protected):**

- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/listings/pending` - Pending listings for approval
- `GET /api/metadata/admin/all` - Get all metadata for admin management
- `POST /api/metadata/seed` - Seed initial car metadata
- `POST /api/metadata/makes` - Create new car make
- `PUT /api/metadata/makes/:id` - Update car make
- `DELETE /api/metadata/makes/:id` - Delete car make
- `POST /api/metadata/metadata` - Create new metadata
- `PUT /api/metadata/metadata/:id` - Update metadata
- `DELETE /api/metadata/metadata/:id` - Delete metadata

## Environment Variables

**Server (.env):**

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=carmarket_user
DATABASE_PASSWORD=carmarket_password
DATABASE_NAME=carmarket
JWT_SECRET=your-secret-key
PORT=3000
```

**Client (.env):**

```env
VITE_API_URL=http://localhost:3000/api
```

## License

MIT
