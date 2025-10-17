# Architectural Decision Records (ADRs)

This document explains the **why** behind key architectural decisions in the VectorIcons backend.

## Table of Contents
- [Mixin Composition Over Inheritance](#mixin-composition-over-inheritance)
- [EventBus Over Direct Dependencies](#eventbus-over-direct-dependencies)
- [Objection.js Over Sequelize/TypeORM](#objectionjs-over-sequeliz

etypeorm)
- [Adapter Pattern for Cross-Cutting Concerns](#adapter-pattern-for-cross-cutting-concerns)
- [Real Database in Integration Tests](#real-database-in-integration-tests)
- [Offset + Cursor Pagination](#offset--cursor-pagination)

---

## Mixin Composition Over Inheritance

### Decision
Use mixins to compose service behavior instead of deep inheritance hierarchies.

### Context
We needed to add cross-cutting concerns (observability, caching, access control, soft deletes, activation state) to 50+ service classes. Traditional inheritance would create a complex hierarchy:

```
BaseService
  ↓
ObservableService
  ↓
CacheableService
  ↓
AccessControllableService
  ↓
SoftDeletableService
  ↓
ActivatableService
  ↓
IconService (finally!)
```

**Problems with deep inheritance:**
- Fragile base class problem
- Ordering matters (what if you want caching but not observability?)
- Hard to test individual concerns
- Tight coupling

### Solution
Compose behaviors with mixins:

```javascript
const BaseService =
  withObservable(
  withCacheable(
  withPluggable(
  withAccessControl(
  withSoftDeletable(
  withActivatable(
    RawBaseService
  ))))));
```

**Benefits:**
- Each concern is independent and testable
- Opt-in: services choose which mixins to apply
- Clear separation of concerns
- Easy to add/remove behaviors
- No fragile base class

**Trade-offs:**
- More complex initial setup
- Mixin order can matter (e.g., Observable wraps Cacheable)
- Debugging stack traces can be deeper
- Not as familiar to junior developers

**What we'd do differently:**
- Document mixin order and why it matters
- Consider dependency injection for some concerns
- Add TypeScript for better type safety with mixins

---

## EventBus Over Direct Dependencies

### Decision
Use an event-driven pub/sub system (EventBus) instead of direct service-to-service dependencies.

### Context
We had several features that needed to trigger side effects:
- User verifies email → send welcome email + create coupon code
- Order completes → send confirmation + notify Slack + update analytics
- Subscription cancels → send survey + create win-back offer

**Direct approach would look like:**
```javascript
class UserService {
  async verifyEmail(userId) {
    await this.repository.update(userId, { emailVerified: true });
    await mailService.sendWelcome(userId);        // Direct dependency
    await couponService.createWelcome(userId);    // Direct dependency
    await slackService.notifySignup(userId);      // Direct dependency
    await analyticsService.track('email_verified'); // Direct dependency
  }
}
```

**Problems:**
- UserService knows about mail, coupons, Slack, analytics
- Hard to add/remove features
- Can't disable notifications in tests
- One failure breaks the whole flow
- Tight coupling

### Solution
Emit events, let plugins handle side effects:

```javascript
class UserService {
  async verifyEmail(userId) {
    await this.repository.update(userId, { emailVerified: true });
    EventBus.emit(EventTypes.USER_VERIFY_EMAIL, { userId });
  }
}

// Separate plugins
EventBus.on(EventTypes.USER_VERIFY_EMAIL, sendWelcomeEmail);
EventBus.on(EventTypes.USER_VERIFY_EMAIL, createWelcomeCoupon);
EventBus.on(EventTypes.USER_VERIFY_EMAIL, notifySlack);
```

**Benefits:**
- UserService doesn't know about side effects
- Easy to add/remove features (just add/remove listeners)
- Plugin failures don't break main flow
- Can disable plugins in tests
- Loose coupling
- Observable: events = telemetry

**Trade-offs:**
- Harder to trace execution flow
- No compile-time guarantees (what listens to this event?)
- Async by default (can't easily get return values)
- Debugging requires looking at multiple files

**What we'd do differently:**
- Add event type registry with TypeScript
- Consider CQRS pattern for complex workflows
- Add distributed tracing (already have trace_id support)

---

## Objection.js Over Sequelize/TypeORM

### Decision
Use Objection.js as our ORM instead of Sequelize or TypeORM.

### Context
We needed an ORM that could handle:
- Complex joins and eager loading
- Raw SQL when needed
- JSON columns (PostgreSQL)
- Migrations
- Transactions

### Comparison

| Feature | Objection.js | Sequelize | TypeORM |
|---------|-------------|-----------|---------|
| **SQL Visibility** | ✅ Query builder, raw SQL easy | ❌ Hides SQL | ⚠️ Mixed |
| **Relations** | ✅ Graph queries | ⚠️ Include syntax | ✅ Relations |
| **JSON Support** | ✅ Native | ⚠️ Limited | ⚠️ Limited |
| **TypeScript** | ⚠️ Manual types | ❌ Weak | ✅ Native |
| **Learning Curve** | ⚠️ Steeper | ✅ Easy | ⚠️ Moderate |
| **Performance** | ✅ Fast | ⚠️ Slower | ⚠️ Moderate |

### Solution
Chose Objection.js for:

**1. SQL Transparency**
```javascript
// Easy to see and optimize the SQL
const icons = await Icon.query()
  .select('icons.*', 'sets.name as setName')
  .join('sets', 'icons.set_id', 'sets.id')
  .where('icons.is_active', true)
  .orderBy('icons.created_at', 'desc')
  .limit(10);
```

**2. Graph Queries (Eager Loading)**
```javascript
// Load icon with all relations in one query
const icon = await Icon.query()
  .findById(id)
  .withGraphFetched('[set.family, images, tags]');
```

**3. JSON Column Support**
```javascript
// PostgreSQL JSON queries
const icons = await Icon.query()
  .where('metadata:style', 'outline')
  .where('metadata:tags', '@>', ['business']);
```

**Trade-offs:**
- No built-in TypeScript (we add types manually)
- Steeper learning curve than Sequelize
- Less "magical" (more explicit)
- Smaller community

**What we'd do differently:**
- Add code generation for TypeScript types
- Consider Prisma for new projects (better DX)
- Document our relation graph patterns better

---

## Adapter Pattern for Cross-Cutting Concerns

### Decision
Use adapter pattern for observability, caching, and event buses to allow swappable backends.

### Context
We needed:
- **Observability**: In-memory for tests, Datadog for production
- **Caching**: In-memory for tests, Redis for production
- **Events**: In-memory for tests, Redis pub/sub for distributed

### Solution
Define interfaces, swap implementations:

```javascript
// Observability
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

// Usage
const obs = new Observability(
  process.env.NODE_ENV === 'test'
    ? new InMemoryAdapter()
    : new DatadogAdapter()
);
```

**Benefits:**
- Tests run fast (in-memory adapters)
- Production uses real backends (Datadog, Redis)
- Easy to add new backends (Prometheus, New Relic)
- No vendor lock-in

**Trade-offs:**
- More abstraction layers
- Must maintain adapter interface
- Feature parity across adapters

**What we'd do differently:**
- Add adapter feature flags (some adapters support more features)
- Better documentation of adapter interfaces
- Standardize adapter testing

---

## Real Database in Integration Tests

### Decision
Use real PostgreSQL in integration tests instead of mocks or in-memory SQLite.

### Context
**Option 1: Mock everything**
```javascript
// Fast but brittle
jest.mock('../repository');
repository.findById.mockResolvedValue({ id: 1, name: 'test' });
```

**Option 2: In-memory SQLite**
```javascript
// Fast but different SQL dialect
const db = new Database(':memory:');
```

**Option 3: Real PostgreSQL**
```javascript
// Slower but catches real issues
const db = knex({ client: 'pg', connection: TEST_DATABASE_URL });
```

### Solution
Use real PostgreSQL in integration tests:

**Catches real issues:**
- Schema mismatches (`ALTER TABLE` migrations)
- SQL syntax errors (PostgreSQL-specific features)
- Transaction isolation problems
- Constraint violations
- Index performance issues
- JSON column queries

**Example caught by real DB:**
```javascript
// This passes with mocks, fails with real DB
const icon = await Icon.query()
  .where('metadata:style', 'outline')  // PostgreSQL JSON syntax
  .first();
// Mock: Returns any data you want
// Real DB: Errors if metadata column doesn't exist or isn't JSONB
```

**Trade-offs:**
- **Slower**: Tests take 2-3x longer
- **Setup**: Requires PostgreSQL running
- **Isolation**: Must clean DB between tests

**What we'd do differently:**
- Parallel test execution with multiple test DBs
- Shared test containers (Testcontainers.js)
- Consider hybrid: unit tests with mocks, integration with real DB

**Why it's worth it:**
- Caught 10+ bugs that mocks would have missed
- Confidence in production behavior
- Tests actual SQL, not our assumptions

---

## Offset + Cursor Pagination

### Decision
Support both offset-based and cursor-based pagination.

### Context
Different use cases need different pagination:

**Offset-based (page numbers):**
```javascript
// GET /icons?page=5&pageSize=20
{ results: [...], page: 5, total: 1000, totalPages: 50 }
```

**Cursor-based (infinite scroll):**
```javascript
// GET /icons?cursor=eyJpZCI6MTIzfQ&limit=20
{ results: [...], nextCursor: "eyJpZCI6MTQzfQ", prevCursor: "..." }
```

### Solution
Implemented both in BaseService:

```javascript
class BaseService {
  // Offset pagination for admin UIs
  async paginate(where, page, pageSize, opts) {
    const { results, total } = await this.repository.paginate(
      where, page, pageSize, opts
    );
    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  // Cursor pagination for infinite scroll
  async cursorPage(where, order, { limit, cursor, trx }) {
    return this.repository.cursorPage(where, order, { limit, cursor, trx });
  }
}
```

**When to use each:**

| Use Case | Method | Why |
|----------|--------|-----|
| Admin tables | Offset | Need page numbers, totals |
| Infinite scroll | Cursor | Performance at scale |
| Search results | Offset | Users expect page numbers |
| Real-time feeds | Cursor | Data changes frequently |
| Reports | Offset | Need total count |
| Mobile lists | Cursor | Better UX for scrolling |

**Trade-offs:**

**Offset pros:**
- Simple to implement
- Easy to jump to any page
- Shows total pages

**Offset cons:**
- Slow for large offsets (`OFFSET 100000`)
- Inconsistent with inserts/deletes
- Scales poorly

**Cursor pros:**
- Fast at any position
- Consistent with data changes
- Scales to millions of rows

**Cursor cons:**
- Can't jump to specific page
- More complex to implement
- Opaque cursors (base64 encoded)

**What we'd do differently:**
- Default to cursor pagination
- Only use offset where page numbers are required
- Add cursor expiration (cursors can become stale)

---

## Summary

These decisions reflect a balance between:
- **Developer experience** (clear patterns, easy to extend)
- **Performance** (scale to millions of records)
- **Maintainability** (loose coupling, testable)
- **Production readiness** (observability, caching, resilience)

The common thread: **composition over inheritance**, **adapters for flexibility**, **events for decoupling**.
