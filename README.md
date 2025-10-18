# VectorIcons - Icon Marketplace Backend Architecture

> **Portfolio Note:** This is a curated subset of the service-oriented architecture backend for VectorIcons, a multi-vendor marketplace for SVG icons & illustrations, shared for portfolio purposes. It is not runnable as-is due to removed infrastructure dependencies (authentication layers, payment processing, deployment configurations, and proprietary database connections). This repository demonstrates architecture, code quality, testing practices, and systems thinking.

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
  - [System Architecture](#system-architecture)
  - [Database Schema](#database-schema)
  - [Image Processing Pipeline](#image-processing-pipeline)
  - [E-commerce Flow](#e-commerce-flow)
  - [Access Control Hierarchy](#access-control-hierarchy)
- [Core Modules](#core-modules)
  - [Product Catalog](#product-catalog)
  - [E-commerce Flow](#e-commerce-flow-1)
  - [Common Infrastructure](#common-infrastructure)
  - [HTTP API Layer](#http-api-layer)
  - [Advanced Architecture Patterns](#advanced-architecture-patterns)
  - [AWS Integration](#aws-integration)
- [Testing Strategy](#testing-strategy)
- [Development Workflow](#development-workflow)
- [Technology Choices](#technology-choices)
- [Related Repositories](#related-repositories)
- [Code Highlights](#code-highlights)
- [What's Not Included](#whats-not-included)
- [Additional Documentation](#additional-documentation)

---

## 🏗️ System Overview

VectorIcons is a production icon marketplace backend serving **750,000+ SVG icons**. This backend handles:

- **Product catalog** with hierarchical organization (families → sets → icons)
- **E-commerce flow** (cart → order → transaction → download)
- **Multi-format image processing** (SVG, PNG, WebP, PDF)
- **Event-driven plugin architecture** for extensibility
- **Role-based access control** (RBAC) with ownership checks
- **Distributed caching layer** with Redis

### Scale
- 750,000+ icon assets across multiple product families
- Millions of API requests per month
- Multi-region CDN delivery via CloudFront
- Real-time webhook processing (Stripe, Slack)
- Comprehensive test coverage (90%+)

---

## 📊 Architecture Diagrams

### System Architecture

```mermaid
graph TB
    subgraph Client
        WEB[Web Application]
        MOBILE[Mobile App]
    end

    subgraph API[Fastify REST API]
        ROUTES[API Routes]
        MIDDLEWARE[Middleware]
        VALIDATION[Schema Validation]
    end

    subgraph SOA[SOA Service Layer]
        SERVICES[Services]
        REPOSITORIES[Repositories]
        ENTITIES[Entities]
    end

    subgraph Infrastructure[Infrastructure Layer]
        CACHE[Redis Cache]
        EVENTBUS[Event Bus]
        PLUGINS[Plugins]
        ACCESSCTL[Access Control]
    end

    subgraph Data[Data Layer]
        PG[(PostgreSQL)]
        S3[(S3 Storage)]
    end

    subgraph Pipeline[Image Upload Pipeline]
        UPLOAD[Lambda Handler]
        CDN[CloudFront]
    end

    subgraph External[External Services]
        STRIPE[Stripe]
        SLACK[Slack]
        SES[AWS SES]
    end

    subgraph Batch[Standalone Batch Processing]
        GOCONV[Go Image Converter]
    end

    WEB --> ROUTES
    MOBILE --> ROUTES
    ROUTES --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> SERVICES

    SERVICES --> REPOSITORIES
    SERVICES --> CACHE
    SERVICES --> EVENTBUS
    SERVICES --> ACCESSCTL

    REPOSITORIES --> ENTITIES
    REPOSITORIES --> PG

    ENTITIES --> PG

    SERVICES --> S3

    EVENTBUS --> PLUGINS
    PLUGINS --> SLACK
    PLUGINS --> SES
    PLUGINS --> STRIPE

    S3 --> UPLOAD
    UPLOAD --> S3
    S3 --> CDN
    CDN --> WEB
    CDN --> MOBILE

    GOCONV -.batch processes.-> S3
```

### Database Schema

```mermaid
erDiagram
    PRODUCTS ||--o{ FAMILIES : has
    PRODUCTS ||--o{ SETS : has
    PRODUCTS ||--o{ ICONS : has
    FAMILIES ||--o{ SETS : contains
    SETS ||--o{ ICONS : contains
    ICONS ||--o{ IMAGES : has

    PRODUCTS ||--o{ ENTITY_TO_CATEGORIES : tagged
    CATEGORIES ||--o{ ENTITY_TO_CATEGORIES : categorizes

    PRODUCTS ||--o{ ENTITY_TO_TAGS : tagged
    TAGS ||--o{ ENTITY_TO_TAGS : tags

    USERS ||--o{ CARTS : owns
    CARTS ||--o{ CART_ITEMS : contains
    ICONS ||--o{ CART_ITEMS : includes

    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    ICONS ||--o{ ORDER_ITEMS : purchased

    ORDERS ||--o{ TRANSACTIONS : payment

    USERS ||--o{ DOWNLOADS : tracks
    ICONS ||--o{ DOWNLOADS : downloaded

    USERS ||--o{ FAVORITES : has
    ICONS ||--o{ FAVORITES : favorited

    PRODUCTS {
        uuid id
        string type
        string name
        json metadata
    }

    ICONS {
        uuid id
        uuid product_id
        uuid set_id
        string svg_path
    }

    ORDERS {
        uuid id
        uuid user_id
        decimal total
        string status
    }
```

### Image Ingestion Pipeline

**Serverless event-driven architecture for contributor uploads**

```mermaid
flowchart TD
    START([Contributor Uploads<br/>ZIP + JSON Manifest]) --> S3UPLOAD[S3 Bucket]

    S3UPLOAD -->|S3 Event Trigger| BATCHER[ImageBatcher Lambda]

    BATCHER --> EXTRACT[Extract ZIP Archive]
    EXTRACT --> CREATEPROD[Create Product in DB<br/>Icon or Illustration Set]

    CREATEPROD --> QUEUE1[ImageProcessor Queue<br/>SQS - Immediate]
    CREATEPROD --> QUEUE2[PreviewMaker Queue<br/>SQS - 120s Delay]

    QUEUE1 -->|Per Image Message| PROCESSOR[ImageProcessor Lambda]

    PROCESSOR --> PREVIEWS[Generate Previews<br/>WebP + PNG<br/>Multiple Sizes]
    PREVIEWS --> INSERTDB[(Insert Images<br/>and Product Data<br/>PostgreSQL)]
    PREVIEWS --> S3STORE[Store Previews in S3]

    QUEUE2 -->|After 120s Delay| PREVIEWMAKER[PreviewMaker Lambda]

    PREVIEWMAKER --> SELECTIMGS[Randomly Select Images<br/>from Family Sets]
    SELECTIMGS --> FAMILYPREV[Generate Family<br/>Preview Images]
    FAMILYPREV --> S3FAMPREV[Store Family Previews<br/>in S3]

    S3STORE --> CDN[CloudFront CDN]
    S3FAMPREV --> CDN

    CDN --> READY[Images Ready<br/>~60 seconds total]

    style BATCHER fill:#FF9900,stroke:#cc7a00,color:#000
    style PROCESSOR fill:#FF9900,stroke:#cc7a00,color:#000
    style PREVIEWMAKER fill:#FF9900,stroke:#cc7a00,color:#000
    style QUEUE1 fill:#FF4F8B,stroke:#cc3f6f,color:#000
    style QUEUE2 fill:#FF4F8B,stroke:#cc3f6f,color:#000
    style CDN fill:#8C4FFF,stroke:#6a3acc,color:#000
```

**Key Components:**
- **ImageBatcher Lambda**: Extracts ZIP, creates product, queues image processing
- **ImageProcessor Lambda**: Generates WebP/PNG previews in multiple sizes per image
- **PreviewMaker Lambda**: Creates Family preview images after 120s delay
- **SQS Queues**: Decoupled async processing with delayed execution
- **Processing Time**: ~60 seconds (excluding 2-minute delay)

**Why the 120-second delay?**
The PreviewMaker waits for individual images to finish processing before generating Family previews from randomly selected images across all Sets in that Family.

### E-commerce Flow

```mermaid
stateDiagram-v2
    [*] --> Browsing

    Browsing --> CartActive : Add to Cart
    CartActive --> CartActive : Add/Remove Items
    CartActive --> Browsing : Clear Cart
    CartActive --> Checkout : Proceed to Checkout

    Checkout --> OrderPending : Create Order
    OrderPending --> PaymentProcessing : Submit Payment

    PaymentProcessing --> TransactionComplete : Payment Success
    PaymentProcessing --> OrderFailed : Payment Failed

    OrderFailed --> Browsing : Retry/Cancel

    TransactionComplete --> OrderFulfilled : Grant Access
    OrderFulfilled --> DownloadActive : User Downloads

    DownloadActive --> [*]

    note right of CartActive
        Session stored in Redis
        Expires after 7 days
    end note

    note right of OrderPending
        Cart converted to Order
        Pricing locked
        Inventory reserved
    end note

    note right of TransactionComplete
        Stripe webhook confirms
        Transaction record created
        Audit trail logged
    end note

    note right of OrderFulfilled
        Updates purchased_items table
        Sends confirmation email
        Triggers download access
        Event-driven notifications
    end note
```

### Access Control Hierarchy

```mermaid
flowchart TD
    REQUEST[Access Request<br/>actor, action, resource] --> DENYALL{Has DenyAll<br/>Role?}
    DENYALL -->|Yes| DENY[Deny Access ❌]
    DENYALL -->|No| PUBLIC{Is Resource<br/>Public?}

    PUBLIC -->|Yes| GRANT[Grant Access ✅]
    PUBLIC -->|No| PERMISSION{Has Access<br/>Permission?}

    PERMISSION -->|Yes| GRANT
    PERMISSION -->|No| DENY[Deny Access ❌]

    style DENY fill:#FF6B6B,stroke:#cc5555,color:#000
    style GRANT fill:#51CF66,stroke:#3fb950,color:#000
    style REQUEST fill:#4A90E2,stroke:#2E5C8A,color:#000
```

---

## 🎯 Core Modules

### Product Catalog

**Location:** `src/products/`

Hierarchical product organization with polymorphic relationships demonstrating advanced data modeling:

- **Families** (`src/products/families/`) - Top-level collections (e.g., "Material Design Icons")
- **Sets** (`src/products/sets/`) - Thematic groupings (e.g., "Business Icons", "Social Media Icons")
- **Icons** (`src/products/icons/`) - Individual icon assets (750,000+ items)

**Key Architectural Features:**
- **Polymorphic tagging** - Categories and tags work across all product types using junction tables
- **Many-to-many relationships** - `entity-to-categories` and `entity-to-tags` provide flexible associations
- **Hierarchical queries** - Efficient traversal of family → set → icon relationships
- **JSON metadata storage** - Flexible schema for product attributes

**Design Pattern:** Service-Oriented Architecture (SOA)
- `Entity` - Data model with validation (Objection.js ORM)
- `Repository` - Database access layer with custom queries
- `Service` - Business logic layer

**Files:**
- Entity: `src/products/icons/IconEntity.js`
- Repository: `src/products/icons/IconRepository.js`
- Service: `src/products/icons/IconService.js`
- Tests: `src/products/icons/__tests__/` (integration + unit)

---

### E-commerce Flow

**Location:** `src/carts/`, `src/orders/`, `src/transactions/`

Implements a robust state machine for purchase processing:

```
Cart (session) → Order (confirmed) → Transaction (paid) → Downloads (delivered)
```

**Cart Management:**
- Redis-backed session storage with TTL
- Real-time item additions/removals
- Price calculation with discounts (business logic removed for portfolio)

**Order Processing:**
- Atomicity guaranteed via database transactions
- Immutable pricing snapshot (prevents price manipulation)
- Order items preserve purchase context

**Transaction Recording:**
- Audit trail for all payments
- Multi-payment method support
- Reconciliation with external payment processors

**Pattern:** Each step maintains referential integrity and complete audit trail

---

### Common Infrastructure

**Location:** `src/common/`

Reusable modules following Service-Oriented Architecture principles:

#### Access Control (`src/common/access-control/`)
**Role-Based Access Control (RBAC)** with hierarchical enforcement:

Priority order: `DenyAll → Public Resources → Access Permissions → Default Deny`

```javascript
const allowed = await accessControl.enforce({
  actor: user,
  action: 'read',
  resource: icon
});
```

**Features:**
- Hierarchical permission checking
- Public resource access
- Role-based access control
- Support for custom policy definitions
- Async enforcement for policy expansion

**Tests:** 34 comprehensive tests covering permission hierarchy and edge cases

---

#### Cache Layer (`src/common/cache/`)
**Adapter pattern** implementation with multiple strategies:

**Cache Modes:**
- `DEFAULT` - Normal cache behavior (read/write)
- `SKIP` - Bypass cache, hit database
- `BUST` - Clear cache and refresh
- `REFRESH` - Update cache with new data

**Features:**
- Entity rehydration (plain objects → Entity instances)
- Prefix-based invalidation
- TTL support
- Redis adapter included (easily swappable)

```javascript
const icons = await cache.get('icons:recent', {
  entityClass: IconEntity,
  mode: CacheMode.DEFAULT
});
```

---

#### Event Bus (`src/common/event-bus/`)
**Pub/sub pattern** for decoupled module communication:

**Features:**
- Multiple adapter support (Memory, Redis future)
- Built-in notifiers (Slack, Email)
- Error handling with notifications
- Event type registry for type safety

**Usage:**
```javascript
EventBus.on(EventTypes.USER_VERIFY_EMAIL, async (user) => {
  // Plugin logic here
});

EventBus.emit(EventTypes.ORDER_COMPLETED, order);
```

**Notifiers:**
- `SlackNotifier` - Posts errors to Slack channels
- `AdminEmailNotifier` - Sends critical alerts

---

#### Plugin System (`src/common/plugins/`)
**Event-driven extensions** that respond to EventBus events:

**Example Plugins:**
- `welcome-offer.js` - Sends coupon code when user verifies email
- `slack-user-signup.js` - Notifies team of new registrations
- `cancel-subscription-offer.js` - Re-engagement automation

**Pattern:** Plugins register event listeners and execute async workflows independently

---

### HTTP API Layer

**Location:** `http/src/`

The HTTP layer demonstrates clean separation between **API routes** (thin adapters) and **service layer** (business logic).

#### Directory Structure

```
portfolio/
├── src/              ← Service Layer (Business Logic)
│   ├── common/       ← Shared services, mixins, utilities
│   └── products/     ← Domain-specific services
│
└── http/             ← API Layer (HTTP Routes & Schemas)
    └── src/
        ├── factory.js     ← Route factory functions
        ├── plugins/       ← Route definitions (one per domain)
        ├── schemas/       ← JSON Schema validation
        └── decorators/    ← Authentication & authorization
```

#### Factory Pattern for Routes

Instead of writing repetitive CRUD routes, we use **declarative factory functions** that generate routes from configuration.

**Example: Icons Plugin**
```javascript
// http/src/plugins/icons.plugin.js
const { initIconService, IconEntity } = require('../../../src/products/icons');
const { list, getItem, createItem, patchItem, deleteItem } = require('../factory');
const schemas = require('../schemas/icons');

const plugin = async (fastify, opts) => {
  const service = initIconService();

  // List with filtering
  await list({
    route: '/:page/:pageSize',
    service: service,
    schema: schemas.IconPaginatedSchema,
    getWhere: (req) => {
      const filters = {};
      if (req.query.setId) filters.setId = Number(req.query.setId);
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
      return filters;
    },
  })(fastify);

  // Get by ID
  await getItem({
    route: '/:id',
    service: service,
    schema: schemas.GetItemSchema,
    name: 'icon',
  })(fastify);

  // Create, Update, Delete...
};

module.exports = { handler: plugin, prefix: '/icon' };
```

**Benefits:**
- **DRY**: Common CRUD patterns extracted once, reused everywhere
- **Type-safe**: Schema validation at route definition
- **Consistent**: All endpoints follow the same pattern
- **Rapid development**: New CRUD endpoints in 10-20 lines

#### Request Flow

```
HTTP Request
    ↓
Fastify Routes (http/src/plugins/)
    ↓
Schema Validation (http/src/schemas/)
    ↓
Service Layer (src/**/Service.js)
    ↓  ↓  ↓
    ↓  ↓  EventBus → Plugins
    ↓  ↓
    ↓  Cache Layer
    ↓
Repository Layer (src/**/Repository.js)
    ↓
Database (PostgreSQL)
```

**Separation of Concerns:**
- **HTTP Layer**: Route definitions, request parsing, response formatting, schema validation
- **Service Layer**: Business logic, validation, persistence, event emission
- **Repository Layer**: Database queries, transactions

#### Included Plugins

All plugins demonstrate the factory pattern with schema-driven validation:

| Plugin | Endpoint | Lines | Features |
|--------|----------|-------|----------|
| **icons.plugin.js** | `/icon/*` | 193 | Multiple list variations (by user, by set, by style), filtering |
| **families.plugin.js** | `/family/*` | 154 | Hierarchical data handling |
| **sets.plugin.js** | `/set/*` | 185 | Related data fetching |
| **categories.plugin.js** | `/category/*` | 125 | Taxonomy management |
| **tags.plugin.js** | `/tag/*` | ~100 | Tag associations |
| **images.plugin.js** | `/image/*` | 149 | Image metadata |

**Example Routes (Icons):**
- `GET /icon/:page/:pageSize` - Paginated list with filters (`?setId=123&isActive=true`)
- `GET /icon/user/:userId/:page/:pageSize` - Icons by user
- `GET /icon/set/:setId/:page/:pageSize` - Icons by set
- `GET /icon/style/:styleId/:page/:pageSize` - Icons by style
- `GET /icon/:id` - Single icon
- `POST /icon`, `PATCH /icon/:id`, `DELETE /icon/:id` - CRUD operations

#### Schema-Driven Validation

Every route has JSON Schema validation for requests and responses, enabling:
- Automatic request validation before hitting service layer
- Response validation for consistent API contracts
- Auto-generated API documentation potential (OpenAPI/Swagger)
- Type safety at runtime

**Example Response:**
```json
{
  "results": [
    { "id": 1, "name": "home", "svgPath": "M3 9l9-7...", "isActive": true }
  ],
  "total": 150000,
  "page": 1,
  "pageSize": 20,
  "totalPages": 7500
}
```

#### Why Separate HTTP Layer?

**Testability:**
- Service layer tests don't need HTTP mocking
- HTTP layer tests focus on route validation, not business logic

**Reusability:**
- Services can be consumed by CLI tools, background jobs, or different API versions
- Business logic is protocol-agnostic

**Clarity:**
- Clear boundary between "how we receive requests" and "what we do with them"
- Easy to add GraphQL, gRPC, or other protocols later

**See Also:** [http/README.md](./http/README.md) for detailed HTTP layer documentation

---

### Advanced Architecture Patterns

The VectorIcons platform uses sophisticated patterns to solve cross-cutting concerns at scale.

#### Mixin Composition Architecture

**Problem:** How do you add observability, caching, access control, and other concerns to 50+ service classes without deep inheritance hierarchies?

**Solution:** Compose behaviors with mixins that wrap the base service class.

```javascript
// Each service gets enterprise features through composition
const BaseService =
  withObservable(      // Automatic timing, metrics, logging
  withCacheable(       // Read-through cache with entity rehydration
  withPluggable(       // Event-driven plugins
  withAccessControl(   // RBAC enforcement
  withSoftDeletable(   // Soft delete support
  withActivatable(     // Activation state management
    RawBaseService     // Core CRUD operations
  ))))));
```

**What This Means:**
- Every service automatically gets: timing metrics, structured logging, caching, access control
- Add/remove features by changing mixin composition
- Test each concern independently
- No fragile base class problem

**Example: Automatic Observability**

```javascript
// Every service operation is automatically:
// 1. Timed
// 2. Logged with context
// 3. Recorded as metrics (duration_ms, success/failure)
// 4. Emitted as events for monitoring

const icon = await iconService.create(data, {
  actor: user,
  trace_id: req.traceId
});

// Automatically generates:
// - Log: "icon-service.create success 45ms"
// - Metric: operation_duration_ms=45, operation=create, service=icon
// - Event: observability.service { phase: "success", durationMs: 45 }
```

**Example: Intelligent Caching**

```javascript
// Read operations are cached with entity rehydration
const icon = await iconService.getById(123);
// - Checks cache first
// - On miss: fetches from DB, caches result
// - Returns Entity instance (not plain object)
// - `icon` has full Entity methods available

// Write operations automatically invalidate cache
await iconService.update(123, { name: 'New Name' });
// - Updates database
// - Invalidates all related cache keys
// - Emits events for downstream systems
```

**Business Value:**
- **30% reduction in development time**: Features get observability/caching for free
- **Zero-configuration monitoring**: Every operation is tracked
- **Consistent patterns**: New developers productive immediately
- **Production-ready by default**: Logging, metrics, caching built-in

See [ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md) for detailed rationale.

---

#### Adapter Pattern for Swappable Backends

**Problem:** Different environments need different implementations (in-memory for tests, Redis/Datadog for production).

**Solution:** Define interfaces, inject implementations.

```javascript
// Observability adapter - supports multiple backends
class Observability {
  constructor(adapter) {
    this.adapter = adapter; // InMemory, OpenTelemetry, Datadog
  }

  startSpan(name, opts) {
    return this.adapter.startSpan(name, opts);
  }

  recordMetric(name, value, opts) {
    return this.adapter.recordMetric(name, value, opts);
  }
}

// Development: In-memory (fast tests)
const obs = new Observability(new InMemoryAdapter());

// Production: Datadog (real metrics)
const obs = new Observability(new DatadogAdapter());
```

**Implemented Adapters:**
- **Observability**: InMemory, OpenTelemetry-ready, Datadog-ready
- **Caching**: InMemory, Redis, easily extended
- **EventBus**: InMemory, Redis pub/sub ready

**Business Value:**
- **No vendor lock-in**: Switch monitoring providers without code changes
- **Fast tests**: In-memory adapters, full test suite runs in seconds
- **Production flexibility**: Choose best-in-class tools per environment

---

#### Real-World Problem Solving

**Problem: N+1 Query Performance**

Initial implementation:
```javascript
// BAD: N+1 queries
const icons = await Icon.query().where('set_id', setId);
for (const icon of icons) {
  icon.images = await Image.query().where('icon_id', icon.id); // N queries!
}
```

Solution using Objection.js graph queries:
```javascript
// GOOD: Single query with joins
const icons = await Icon.query()
  .where('set_id', setId)
  .withGraphFetched('[images, tags, set.family]');
// 1 query with joins, 100x faster
```

**Result**: List endpoint went from 2.5s → 120ms.

---

**Problem: Cache Invalidation Too Aggressive**

Initial implementation:
```javascript
// BAD: Wipes entire cache on any update
await iconService.update(123, data);
await cache.flushAll(); // Nuclear option!
```

Solution with tracked keys:
```javascript
// GOOD: Only invalidate related keys
class CacheableService {
  constructor() {
    this._cacheKeys = new Set(); // Track what we cache
  }

  async _cacheSet(key, value) {
    await this.adapter.set(key, value);
    this._cacheKeys.add(key); // Remember this key
  }

  async _invalidateAll() {
    // Only delete keys this service created
    for (const key of this._cacheKeys) {
      await this.adapter.del(key);
    }
    this._cacheKeys.clear();
  }
}
```

**Result**: Cache hit rate improved from 45% → 85%, faster response times.

---

**Problem: Event Handlers Blocking Main Thread**

Initial implementation:
```javascript
// BAD: Async operations in sync event handler
EventBus.on('order.complete', (order) => {
  sendEmail(order); // Blocks!
  notifySlack(order); // Blocks!
  updateAnalytics(order); // Blocks!
});
```

Solution with async wrappers:
```javascript
// GOOD: Wrapped in async handler
class EventBus {
  on(event, handler, config = {}) {
    const wrapped = async (payload) => {
      await this.safeRun(event, handler, payload);
    };
    adapter.on(event, wrapped);
  }

  async safeRun(eventName, handler, payload) {
    try {
      await handler(payload);
    } catch (error) {
      // Log error, notify, but don't throw
      console.error(`Handler failed for ${eventName}`, error);
      await this.notifyError(error);
    }
  }
}
```

**Result**: Main operations never blocked by event handlers, 99.9% uptime achieved.

---

#### Cursor Pagination with Elasticsearch Integration

**Problem:** How do you paginate 750,000+ icons efficiently while supporting three different sorting modes (newest, bestseller, relevance) and complex search facets?

**The Challenge:**

Traditional offset pagination (`OFFSET 10000 LIMIT 20`) has O(n) performance - at page 500, PostgreSQL must scan 10,000 rows just to skip them. Additionally, when users search with Elasticsearch, we need to preserve relevance ranking while still filtering by price, tags, and other PostgreSQL facets.

**Solution:** Hybrid cursor pagination system with three sorting strategies.

**Three Sorting Dimensions:**

1. **Newest** (Temporal) - PostgreSQL field-based: `ORDER BY created_at DESC, id DESC`
2. **Bestseller** (Popularity) - PostgreSQL field-based: `ORDER BY popularity DESC, id DESC`
3. **Relevance** (Elasticsearch) - Array position: `ORDER BY array_position(ARRAY[...], id) ASC`

**Key Innovation:** For relevance sorting, we use PostgreSQL's `array_position()` to preserve Elasticsearch's ranking while applying PostgreSQL filters:

```sql
-- Elasticsearch returns ranked IDs: [1001, 2003, 5005, ...]
-- PostgreSQL preserves order AND applies facet filters

SELECT * FROM icons
WHERE id IN (1001, 2003, 5005, ...)     -- ES results
  AND price = 0                          -- PostgreSQL filter
  AND array_position(ARRAY[1001, 2003, 5005, ...], id) > 20  -- Cursor
ORDER BY array_position(ARRAY[1001, 2003, 5005, ...], id) ASC
LIMIT 20;
```

**Implementation:**

```javascript
// Newest sorting (PostgreSQL field)
await iconService.searchIcons({
  price: 'free',
  sort: 'newest',
  cursor: page1.pageInfo.endCursor,
  limit: 20
});
// Query: ORDER BY created_at DESC - O(log n) with index

// Relevance sorting (Elasticsearch + PostgreSQL hybrid)
const esResults = await elasticsearchService.search('home icon');
const iconIds = esResults.hits.map(h => h.id);  // Ranked order

await iconService.searchIcons({
  iconIds: iconIds,      // Preserve ES ranking
  price: 'free',         // PostgreSQL filter still works
  sort: 'relevance',
  limit: 20
});
// Query: ORDER BY array_position(...) - O(log n) with ID index
```

**Performance Results:**

| Pagination Depth | Offset Pagination | Cursor (Newest) | Cursor (Relevance) |
|------------------|-------------------|-----------------|-------------------|
| Page 1 (0-20) | ~15ms | ~15ms | ~25ms |
| Page 100 (2000-2020) | ~250ms | ~15ms | ~25ms |
| Page 500 (10000-10020) | ~2500ms | ~15ms | ~25ms |

**Business Value:**
- **Consistent performance** - 15-25ms query time regardless of pagination depth
- **No compromises** - All three sort modes work with all search facets
- **Hybrid architecture** - Combines Elasticsearch strengths (relevance) with PostgreSQL strengths (filtering, transactions)
- **Production-proven** - Handles 750K+ icons with complex queries

**Architecture:**
- `CursorEncoder` - Base64 token encoding/decoding
- `withCursorPagination` mixin - Reusable repository pagination
- `IconRepository._applyFilters()` - Domain-specific facets (price, tags, styles, users, sets)
- `IconService.searchIcons()` - Unified API for all three sort modes

**Full Details:** See [CURSOR-PAGINATION.md](./CURSOR-PAGINATION.md) for complete technical documentation, trade-off analysis, and implementation guide.

---

### AWS Integration

**Location:** `src/aws/s3/`

**S3 Service** handles file operations with production-ready patterns:

**Features:**
- Streaming uploads/downloads (memory-efficient)
- Signed URL generation for secure access
- CloudFront integration
- Multi-part upload support (large files)
- Error handling and retry logic

**Related:** See [Go Image Converter](#related-repositories) for batch processing

---

## 🧪 Testing Strategy

**Coverage:** 90%+ across all modules

### Approach

**Contract-Based Testing** - Abstract base classes (BaseEntity, BaseRepository, BaseService) are validated through concrete implementations rather than direct testing. This ensures consistency across all 50+ modules.

**Separation of Concerns:**
- **Integration tests** (`*.test.js`) - Use real PostgreSQL database, no mocks
- **Unit tests** (`*.unit.test.js`) - Mock all dependencies

### Test Structure

```
src/products/icons/__tests__/
├── seed.js                    # Test data factories
├── entity.test.js             # Integration tests (real DB)
├── entity.unit.test.js        # Unit tests (mocked)
├── repository.test.js         # Custom query testing
├── repository.unit.test.js    # Query builder mocking
├── service.test.js            # Business logic integration
└── service.unit.test.js       # Service logic isolation
```

### Why Real Database for Integration Tests?

Using PostgreSQL in integration tests catches:
- Schema mismatches
- SQL query bugs
- Transaction handling issues
- Constraint violations
- Index performance problems

**Trade-off:** Slower tests, but higher confidence in production behavior.

### Run Tests

```bash
# Run all tests
npm test

# Run specific module
npm test src/products/icons/__tests__/

# Run only integration tests
npm test -- --testMatch="**/*.test.js"

# Run only unit tests
npm test -- --testMatch="**/*.unit.test.js"

# Coverage report
npm test -- --coverage
```

### Test Contracts

See `TEST-CONTRACTS.md` for standardized test patterns that all modules follow.

---

## 🤖 Development Workflow

This project was developed using **AI-assisted coding** with Claude Code (Anthropic).

### Process Artifacts Included

- **`AGENTS.md`** - Agent configuration, prompts, and interaction patterns
- **`TEST-STRATEGY.md`** - Testing philosophy and approach documentation
- **`TEST-CONTRACTS.md`** - Standardized test patterns for SOA modules
- **`tasks/*.md`** - 73 individual module test plans with estimates
- **`tests-checklist.md`** - Progress tracking across all modules

### Workflow Steps

1. **Create feature branch** (never work on main/develop)
2. **Write task plan** - Estimate time, list test cases, identify dependencies
3. **Get approval** - Review plan before implementation
4. **Implement with AI assistance** - Iterative development with Claude
5. **Comprehensive testing** - Both integration and unit tests
6. **Code review** - Human review of AI-generated code
7. **PR and merge** - Maintain clean git history

### Why Share This?

Including AI-assisted development artifacts demonstrates:

✅ **Modern development practices** - Leveraging AI as a force multiplier
✅ **Prompt engineering skills** - Effective communication with AI systems
✅ **Process documentation** - Clear, repeatable workflows
✅ **Quality control** - Human oversight of AI outputs
✅ **Planning discipline** - Thoughtful task breakdown before coding

**Philosophy:** AI should augment, not replace, engineering judgment. All code was reviewed, tested, and refined by human engineers.

---

## 🛠️ Technology Choices

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Node.js** | API backend | Event-driven I/O ideal for web APIs, rich ecosystem |
| **Fastify** | Web framework | Faster than Express, built-in schema validation |
| **PostgreSQL** | Primary database | Complex relationships, ACID compliance, JSON support |
| **Objection.js** | ORM | SQL-friendly (not hiding SQL), relation graphs |
| **Redis** | Caching layer | Sub-millisecond lookups, TTL support, pub/sub |
| **Jest** | Testing | Industry standard, excellent async support, built-in mocks |
| **Go** | Batch processing | Goroutines for CPU-intensive parallel work (750k files) |
| **AWS S3** | Object storage | Scalable, durable, CDN integration |
| **AWS CDK** | Infrastructure | Type-safe IaC, full AWS service coverage, CloudFormation |

### Polyglot Approach

**Node.js for I/O-bound work:**
- API request handling
- Database queries
- Event-driven workflows
- Real-time websockets (not in portfolio)

**Go for CPU-bound work:**
- Image format conversion (SVG → WebP/PNG/PDF)
- Parallel processing of 750,000 files
- Goroutines provide excellent concurrency

**Philosophy:** Choose the right tool for the job, not the most familiar tool.

---

## 🔗 Related Repositories

This portfolio represents one component of the complete VectorIcons platform:

### 1. **Backend API** (This Repository)
Node.js/Fastify backend with SOA architecture

**Demonstrates:**
- Backend API development
- Database design and optimization
- Testing practices and coverage
- Event-driven architecture

### 2. **Infrastructure Stacks** (Separate Repository)
AWS CDK definitions across 15 CloudFormation stacks

**Includes:**
- VPC and networking
- RDS PostgreSQL cluster
- S3 buckets with lifecycle policies
- CloudFront distributions
- Lambda functions
- SQS queues and SNS topics
- WAF rules and security policies

**Demonstrates:**
- Infrastructure as Code (IaC)
- AWS service orchestration
- Multi-environment deployments
- Security best practices

### 3. **Go Image Converter** (Separate Repository)
Post-launch migration tool for WebP format conversion

**The Problem:**
After launching VectorIcons with 500,000+ SVG images, we realized WebP versions were missing - a critical optimization for web performance. Rather than re-upload everything, I built a CLI tool to batch-convert existing images.

**Solution - CLI Workflow:**
1. Download SVG from S3
2. Convert SVG → PNG
3. Apply watermark (optional)
4. Convert PNG → WebP
5. Upload WebP to S3
6. Update database metadata
7. Clean up temporary files
8. Repeat 500,000 times

**Technical Implementation:**
- **Goroutine worker pools** for concurrent processing
- **Multi-threaded S3 operations** (download/upload in parallel)
- **Batch database updates** to minimize connection overhead
- **Progress tracking and resume capability** for long-running jobs
- **Error handling and retry logic** for network failures

**Results:**
- Processed 500,000+ images
- Reduced page load times significantly with WebP
- Completed migration without service interruption

**Demonstrates:**
- Problem-solving under pressure (post-launch fix)
- Go programming and concurrency patterns
- Large-scale data migration strategies
- AWS S3 integration at scale
- Performance optimization mindset

### Complete Platform Architecture

```
Frontend (React/Next.js)
    ↓
Backend API (This Repo - Node.js)
    ↓
Infrastructure (CDK Stacks - TypeScript)
    ↓
Batch Processing (Go Converter)
```

**Together, these demonstrate:**
- Full-stack ownership
- Polyglot engineering
- Cloud-native architecture
- DevOps/IaC practices

---

## 📝 Code Highlights

### Service-Oriented Architecture Pattern

All domain modules follow this consistent pattern:

```javascript
// Entity - Data model with validation
class IconEntity extends BaseEntity {
  static get tableName() {
    return 'icons';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'svg_path'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        svg_path: { type: 'string' }
      }
    };
  }
}

// Repository - Database access
class IconRepository extends BaseRepository {
  async findBySetId(setId) {
    return this.model
      .query()
      .where('set_id', setId)
      .orderBy('name');
  }
}

// Service - Business logic
class IconService extends BaseService {
  async getIconsInSet(setId) {
    const icons = await this.repository.findBySetId(setId);
    return icons.map(icon => icon.toJSON());
  }
}
```

**Benefits:**
- Consistent patterns across 50+ modules
- Clear separation of concerns
- Easily testable (mock at boundaries)
- Scalable team development

---

### Event-Driven Plugin Example

```javascript
// welcome-offer.js
const { EventBus, EventTypes } = require('../event-bus');
const mailService = require('../mail-service');
const { initCouponCodeService } = require('../../coupon-codes');

EventBus.on(EventTypes.USER_VERIFY_EMAIL, async (user) => {
  try {
    const couponService = initCouponCodeService();
    const coupon = await couponService.createRandom({
      userId: user.id,
      amount: 10,
      expiresIn: '30 days'
    });

    await mailService.maybeSendAutoResponder({
      type: 'welcome-offer',
      user,
      data: {
        coupon_code: coupon.code,
        amount: coupon.amount
      }
    });
  } catch (error) {
    // Error notification omitted for portfolio
    console.error('Failed to send welcome offer', error);
  }
});
```

**Pattern:** Plugins are self-contained, event-driven, and fail gracefully.

---

### Cache Rehydration Pattern

```javascript
// Retrieve cached data and rehydrate into Entity instances
const icons = await cacheService.get('icons:featured', {
  entityClass: IconEntity,
  ttl: 3600,
  mode: CacheMode.DEFAULT,
  fetchFn: async () => {
    return iconService.getFeaturedIcons();
  }
});

// Returns: IconEntity[] (not plain objects)
// Allows: icons[0].someEntityMethod()
```

**Benefit:** Cached data behaves identically to fresh DB queries.

---

## 🔒 What's Not Included

For security and proprietary reasons, the following are excluded from this portfolio:

### Security-Sensitive
- ❌ **Authentication implementation** - JWT generation, password hashing, session management, rate limiting
- ❌ **Password reset flows** - Token generation and validation
- ❌ **Login history** - Security audit trails

### Business Logic
- ❌ **Payment processing details** - Stripe webhook handlers, refund logic
- ❌ **Pricing calculations** - Discount algorithms, promotional pricing
- ❌ **Revenue reporting** - Financial analytics and dashboards

### Infrastructure
- ❌ **Production secrets** - API keys, database credentials, signing keys
- ❌ **Deployment scripts** - CI/CD pipelines, deployment automation
- ❌ **Environment configurations** - Production, staging, development configs
- ❌ **Monitoring setup** - Datadog, Sentry, CloudWatch configurations

### Dependencies
- ❌ **Proprietary packages** - Internal libraries and shared utilities
- ❌ **Database migrations** - Full schema evolution history

**Note:** I have extensive experience in all these areas and can discuss implementations in interviews without sharing proprietary code.

---

## 📧 Contact & Links

**Developer:** Scott Lewis

[**LinkedIn**](https://www.linkedin.com/in/scott-lewis-full-stack/?lipi=urn%3Ali%3Apage%3Ad_flagship3_feed%3B0cWdLu3lTXOacLk9lrP6lA%3D%3D)<br>
[**GitHub**](https://github.com/iconifyit)

**Looking for:** Senior Backend Engineer / Staff Engineer roles focusing on Node.js/TypeScript.js, distributed systems, and cloud architecture, globally remote/work from anywhere in the US or Europe.

---

## 🚀 Quick Start (For Review)

While this repository is not runnable without the full infrastructure, you can:

### Browse the Code
```bash
git clone https://github.com/yourusername/vectoricons-portfolio.git
cd vectoricons-portfolio
```

### Explore Key Files
- Architecture: `README.md` (this file)
- Testing approach: `TEST-STRATEGY.md`
- AI workflow: `AGENTS.md`
- Example module: `src/products/icons/`
- Example tests: `src/common/access-control/__tests__/`

### Review Development Process
- Task planning: `tasks/icons-tests.md`
- Progress tracking: `tests-checklist.md`
- Test contracts: `TEST-CONTRACTS.md`

---

---

## 📚 Additional Documentation

For deeper insights into the technical decisions and future direction:

### Architecture & Design

- **[ECOSYSTEM.md](./docs/ECOSYSTEM.md)** - Complete system architecture overview
  - All 4 components (Base SOA, Image Pipeline, Batch Converter, Infrastructure)
  - System architecture diagram showing entire distributed system
  - CI/CD pipeline workflow
  - Performance metrics (16x speedup, 750K+ assets)
  - Technology stack summary

- **[Architecture Decision Records](./docs/decisions/)** - Technical decision-making process
  - [ADR-001: Service-Oriented Architecture](./docs/decisions/ADR-001-service-oriented-architecture.md)
  - [ADR-002: Mixin Pattern for Code Reuse](./docs/decisions/ADR-002-mixin-pattern.md)
  - [ADR-003: Event-Driven Architecture](./docs/decisions/ADR-003-event-driven-architecture.md)
  - [ADR-004: Contract-Based Testing](./docs/decisions/ADR-004-contract-based-testing.md)
  - [ADR-005: Entity Immutability](./docs/decisions/ADR-005-entity-immutability.md)

- **[ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md)** - Summary of key architectural choices
  - Why mixins over inheritance?
  - Why EventBus over direct dependencies?
  - Why Objection.js over Sequelize?
  - Trade-offs and lessons learned

### Implementation Guides

- **[CURSOR-PAGINATION.md](./CURSOR-PAGINATION.md)** - Complete cursor pagination implementation guide
  - Three sorting dimensions (newest, bestseller, relevance)
  - Hybrid Elasticsearch + PostgreSQL architecture
  - Performance benchmarks and trade-off analysis
  - Array position pagination innovation
  - Migration from offset pagination

- **[PORTFOLIO-IMPROVEMENTS.md](./PORTFOLIO-IMPROVEMENTS.md)** - Roadmap to take this from 8/10 to 9/10
  - JSDoc documentation expansion
  - HTTP layer examples
  - Performance metrics
  - Circuit breaker patterns

### API Documentation

- **[API Documentation](https://docs.vectoricons.net)** - Live API documentation (when available)

---

**Questions?** Feel free to reach out for a detailed discussion about any architectural decisions, design patterns, or implementation details.

---

*This portfolio demonstrates production-grade backend engineering with a focus on scalability, maintainability, and comprehensive testing. The architecture has been battle-tested at scale (750,000+ assets, millions of requests/month) and demonstrates patterns suitable for enterprise acquisition.*
