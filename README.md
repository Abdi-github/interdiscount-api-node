# Interdiscount Clone API

REST API backend for a Swiss electronics retailer clone (interdiscount.ch), built with Node.js, Express 5, TypeScript, MongoDB, and Redis.

## Overview

| Metric | Value |
|--------|-------|
| **Modules** | 20 domain modules |
| **Endpoints** | 130+ REST API endpoints |
| **Source Files** | 170+ TypeScript files |
| **Seed Data** | 18 JSON files (3,035 products, 1,126 categories, 647 brands, 164 stores, 26 cantons, 130 cities) |
| **Languages** | 4 (DE, EN, FR, IT) |
| **Product Images** | 3,034 uploaded to Cloudinary (3 sizes each) |
| **Roles** | 6 (super_admin, admin, store_manager, warehouse_staff, customer_support, customer) |

## Tech Stack

| Area | Technology |
|------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Language | TypeScript 5.9 (strict mode) |
| Database | MongoDB 7 / Mongoose 9 |
| Cache | Redis 7 / ioredis |
| Auth | JWT (access + refresh tokens) |
| RBAC | Roles + Permissions (6 roles, 37 permissions) |
| Validation | Zod |
| Logging | Winston + daily rotate file |
| Email | Nodemailer + Mailpit (dev) |
| Queues | BullMQ (Redis-backed) |
| Payments | Stripe + TWINT (sandbox) + PostFinance (sandbox) + Invoice |
| Images | Sharp + Cloudinary + Multer |
| Security | Helmet, CORS, hpp, express-mongo-sanitize, XSS sanitization |
| Rate Limiting | express-rate-limit + rate-limit-redis |
| Containers | Docker + Docker Compose |
| Testing | Jest + Supertest |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)

### Start with Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd interdiscount-api-node

# Copy environment file
cp .env.example .env

# Start all services
docker compose -f docker-compose.dev.yml up -d

# Seed the database
docker compose -f docker-compose.dev.yml exec api npm run seed

# API is now running at http://localhost:4010
```

### Docker Services

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **API** | 4010 | http://localhost:4010 | Express REST API |
| **MongoDB** | 27025 | `mongodb://localhost:27025` | Database |
| **Redis** | 6385 | `redis://localhost:6385` | Cache + BullMQ |
| **Mongo Express** | 8090 | http://localhost:8090 | DB admin UI |
| **Redis Commander** | 8091 | http://localhost:8091 | Redis admin UI |
| **Mailpit** | 8030 / 1030 | http://localhost:8030 | Email testing (UI / SMTP) |

### Verify Installation

```bash
# Health check
curl http://localhost:4010/api/v1/health

# Login as admin
curl -X POST http://localhost:4010/api/v1/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin.de@interdiscount-clone.ch","password":"Password123!"}'

# Browse products
curl http://localhost:4010/api/v1/public/products?limit=5

# Browse categories (tree)
curl http://localhost:4010/api/v1/public/categories?format=tree

# Search products
curl "http://localhost:4010/api/v1/public/search?q=samsung&limit=10"
```

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Ensure MongoDB and Redis are running locally
# Update .env with local connection strings

# Run in development mode (hot reload)
npm run dev

# Seed database
npm run seed

# Fresh seed (drops existing data)
npm run seed -- --fresh
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin.de@interdiscount-clone.ch` | `Password123!` |
| Store Manager | `manager.de@interdiscount-clone.ch` | `Password123!` |
| Customer | `customer.de@example.ch` | `Password123!` |

## Project Structure

```
src/
├── app.ts                          # Express app setup & middleware
├── server.ts                       # Server entry point & graceful shutdown
├── config/
│   ├── index.ts                    # Environment configuration
│   ├── database.ts                 # MongoDB connection
│   ├── redis.ts                    # Redis connection
│   └── cloudinary.ts               # Cloudinary config
├── middleware/
│   ├── auth.ts                     # JWT authentication
│   ├── rbac.ts                     # Role-based access control
│   ├── validate.ts                 # Zod validation
│   ├── rateLimiter.ts              # Rate limiting (global + per-endpoint)
│   ├── sanitize.ts                 # Input sanitization
│   ├── xssSanitize.ts             # XSS protection
│   ├── language.ts                 # Accept-Language parsing
│   ├── upload.ts                   # Multer file upload
│   ├── requestLogger.ts           # Request/response logging
│   └── errorHandler.ts            # Global error handler
├── modules/
│   ├── auth/                       # Registration, login, password reset, email verification
│   ├── users/                      # Customer profile management
│   ├── addresses/                  # Delivery/billing addresses
│   ├── cantons/                    # Swiss cantons (26)
│   ├── cities/                     # Swiss cities with postal codes
│   ├── stores/                     # Physical store locations (164)
│   ├── categories/                 # Product category tree (1,126 categories, 5 levels)
│   ├── brands/                     # Product brands (647)
│   ├── products/                   # Product catalog (3,035 products)
│   ├── search/                     # Full-text search, autocomplete, filters
│   ├── orders/                     # Order placement & lifecycle
│   ├── payments/                   # Stripe, TWINT, PostFinance, invoice
│   ├── reviews/                    # Product ratings & reviews
│   ├── wishlists/                  # Customer wishlists
│   ├── coupons/                    # Discount coupons
│   ├── notifications/              # In-app notifications
│   ├── store-management/           # Store manager portal
│   │   ├── dashboard/              # Store dashboard & stats
│   │   ├── info/                   # Store info & staff
│   │   ├── inventory/              # Stock management
│   │   ├── pickup/                 # Click & collect queue
│   │   ├── transfers/              # Inter-store stock transfers
│   │   └── promotions/             # Store-specific promotions
│   ├── admin/                      # Admin route aggregator
│   │   └── admin-*/                # 12 admin sub-modules
│   ├── analytics/                  # Platform & store analytics
│   ├── roles/                      # RBAC role management
│   ├── permissions/                # RBAC permission management
│   ├── shared/                     # Shared services (images, etc.)
│   └── health/                     # Health check endpoints
├── queues/
│   ├── email.queue.ts              # Email queue (BullMQ)
│   ├── notification.queue.ts       # Notification queue
│   └── processors/                 # Queue workers
├── utils/
│   ├── ApiResponse.ts              # Standardized response helper
│   ├── asyncHandler.ts             # Async route wrapper
│   ├── jwt.ts                      # JWT sign/verify helpers
│   ├── hash.ts                     # bcrypt helpers
│   ├── formatters.ts               # CHF currency & date formatters
│   └── logger.ts                   # Winston logger
└── types/
    ├── express.d.ts                # Express type extensions
    └── global.d.ts                 # Global type declarations
```

## API Endpoints

### Public (No Auth Required)

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Auth | 7 | Register, login, refresh, forgot/reset password, verify email |
| Cantons | 3 | List, by ID, by code |
| Cities | 4 | List, by ID, by slug, by postal code |
| Stores | 3 | List (filter by canton/city/format/geo), by ID, by slug |
| Categories | 4 | List (flat/tree), by ID, by slug, children |
| Brands | 3 | List, by ID, by slug |
| Products | 5 | List (rich filtering), by ID, by slug, related, reviews |
| Search | 3 | Full-text search, suggestions, filters |

### Customer (Auth Required)

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Profile | 5 | Get/update profile, change password, upload/remove avatar |
| Addresses | 5 | CRUD + set default |
| Orders | 5 | Place order, list, detail, cancel, return |
| Payments | 3 | Initiate, check status, simulate (dev) |
| Reviews | 4 | Create, list mine, update, delete |
| Wishlist | 4 | List, add, remove, check |
| Coupons | 2 | Validate, list available |
| Notifications | 4 | List, unread count, mark read, mark all read |

### Store Manager (Auth + Store Access)

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Dashboard | 4 | Overview, revenue, top products, pickup summary |
| Store Info | 3 | Get/update store info, list staff |
| Inventory | 8 | List, detail, update, bulk update, scan, low-stock, out-of-stock, export CSV |
| Pickup Orders | 6 | List, detail, confirm, ready, collected, cancel |
| Stock Transfers | 6 | List, create, detail, ship, receive, cancel |
| Promotions | 5 | CRUD + delete |
| Analytics | 3 | Dashboard, revenue, top products |

### Admin (Auth + Admin Role)

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Dashboard | 3 | Platform stats, revenue, recent orders |
| Users | 6 | List, detail, update, status, get/assign roles |
| Products | 7 | CRUD, status, image upload/delete |
| Categories | 5 | CRUD + reorder |
| Brands | 4 | CRUD |
| Stores | 9 | CRUD, status, inventory, staff, analytics |
| Transfers | 4 | List, detail, approve, analytics |
| Orders | 4 | List, detail, status update, export CSV |
| Reviews | 4 | List, detail, approve, delete |
| Coupons | 5 | CRUD |
| Locations | 6 | Canton & city CRUD |
| RBAC | 6 | Roles CRUD, permissions list, role permissions |
| Analytics | 7 | Platform stats, revenue, top products/stores/categories, user growth, recent orders |

### System

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Health | 4 | API, database, Redis, queues |
| Webhooks | 3 | Stripe, TWINT, PostFinance |

## API Response Format

```json
// Success (single item)
{ "success": true, "message": "Product retrieved", "data": { ... } }

// Success (list)
{ "success": true, "message": "Products retrieved", "data": [...], "pagination": { "page": 1, "limit": 24, "total": 3035, "total_pages": 127, "has_next": true, "has_prev": false } }

// Error
{ "success": false, "error": { "code": 404, "message": "Product not found" } }
```

## Product Filtering

Products support rich query filters:

| Filter | Query Param | Example |
|--------|------------|---------|
| Category | `category` | `?category=cat_smartphones` |
| Brand | `brand` | `?brand=samsung` |
| Price range | `min_price`, `max_price` | `?min_price=100&max_price=500` |
| Availability | `availability` | `?availability=AVAILABLE` |
| In-store pickup | `in_store` | `?in_store=true` |
| Speed delivery | `speed` | `?speed=true` |
| Sustainable | `sustainable` | `?sustainable=true` |
| On sale | `on_sale` | `?on_sale=true` |
| Min rating | `min_rating` | `?min_rating=4` |
| Sort | `sort` | `?sort=price_asc` / `price_desc` / `rating` / `newest` |
| Pagination | `page`, `limit` | `?page=1&limit=24` |
| Search | `q` | `?q=samsung+galaxy` |

## Order Lifecycle

```
Delivery:  PLACED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                                     └→ RETURNED
Pickup:    PLACED → CONFIRMED → PROCESSING → READY_FOR_PICKUP → PICKED_UP
Cancel:    PLACED/CONFIRMED → CANCELLED
```

## Key Features

### Click & Collect (Store Pickup)
Customers choose home delivery or collect from 164+ physical stores. Store managers process pickup orders through a dedicated queue (confirm → ready → collected).

### Store Inventory Management
Per-store stock tracking with quantity, reserved count, min/max thresholds, physical location, and display unit flags. Supports bulk updates, barcode scanning, CSV export, and low-stock alerts.

### Inter-Store Stock Transfers
Store managers request stock transfers between stores. Admin approval required. Full lifecycle tracking: REQUESTED → APPROVED → IN_TRANSIT → RECEIVED.

### Store Promotions
Store-level promotions (percentage, fixed, buy-x-get-y) scoped to specific products, categories, or store-wide. Time-limited with automatic activation.

### Multi-Language Support
API respects `Accept-Language` header for DE (default), EN, FR, IT — Switzerland's four main languages.

### Queue System (BullMQ)
Asynchronous processing for email delivery and notification creation. Handles verification emails, password resets, order confirmations, shipping notifications, and pickup-ready alerts.

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=4010

# Database
MONGODB_URI=mongodb://mongo:27017/interdiscount

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dzyyygr1x
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Mailpit in dev)
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_FROM=noreply@interdiscount-clone.ch

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Pagination
DEFAULT_PAGE_SIZE=24
MAX_PAGE_SIZE=100
```

## Seed Data

| Collection | Records | Description |
|------------|---------|-------------|
| cantons | 26 | All Swiss cantons |
| cities | 130 | Swiss cities with postal codes |
| categories | 1,126 | Hierarchical product categories (5 levels) |
| brands | 647 | Product brands |
| stores | 164 | Physical retail stores |
| products | 3,035 | Electronics products with images, specs, pricing |
| users | 48 | Test users (all roles) |
| roles | 6 | RBAC roles |
| permissions | 37 | Granular permissions |
| role_permissions | 68 | Role-to-permission mappings |
| user_roles | 48 | User-to-role assignments |
| addresses | 54 | User delivery/billing addresses |
| orders | 67 | Sample orders (delivery + pickup) |
| order_items | 222 | Order line items |
| reviews | 96 | Product reviews |
| wishlists | 92 | User wishlist entries |
| coupons | 6 | Discount coupons |

```bash
# Seed all data
npm run seed

# Fresh seed (drops collections first)
npm run seed -- --fresh
```

## Postman Collections

API documentation is provided as Postman collections — 20 per-module files plus a combined collection.

```
postman/
├── interdiscount-api.postman_collection.json   # Combined (201 requests)
├── interdiscount-api.postman_environment.json   # Environment variables
├── health.postman_collection.json
├── auth.postman_collection.json
├── cantons.postman_collection.json
├── cities.postman_collection.json
├── stores.postman_collection.json
├── categories.postman_collection.json
├── brands.postman_collection.json
├── products.postman_collection.json
├── search.postman_collection.json
├── users.postman_collection.json
├── addresses.postman_collection.json
├── orders.postman_collection.json
├── payments.postman_collection.json
├── reviews.postman_collection.json
├── wishlists.postman_collection.json
├── coupons.postman_collection.json
├── notifications.postman_collection.json
├── store-management.postman_collection.json
├── admin.postman_collection.json
└── analytics.postman_collection.json
```

Import the combined collection + environment file into Postman. Run the "Login" request first to set auth tokens, then explore any module.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `ts-node-dev` | Development mode with hot reload |
| `npm run build` | `tsc` | Compile TypeScript |
| `npm start` | `node dist/server.js` | Production mode |
| `npm run seed` | — | Seed database from JSON files |
| `npm run seed -- --fresh` | — | Drop & re-seed |
| `npm run lint` | `eslint` | Lint TypeScript files |
| `npm run lint:fix` | `eslint --fix` | Auto-fix lint issues |
| `npm run format` | `prettier` | Format code |
| `npm test` | `jest` | Run tests |
| `npm run test:coverage` | `jest --coverage` | Run tests with coverage |

## Production Deployment

```bash
# Build and start production services
docker compose -f docker-compose.prod.yml up -d

# Production includes:
# - Multi-stage Docker build (smaller image)
# - MongoDB with authentication
# - Redis with memory limits & LRU eviction
# - Health checks on all services
# - Resource limits (CPU & memory)
# - Non-root user in container
```

## License

ISC
