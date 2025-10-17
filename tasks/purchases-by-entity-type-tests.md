IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create tests for purchases-by-entity-type view

## Goal
Add custom tests for purchases-by-entity-type view (read-only database view, not a table).

## Module Analysis

### Purchases By Entity Type View
**SQL View**: `refs/db-models/schema.sql`
```sql
CREATE VIEW public.purchases_by_entity_type AS
 WITH user_sets AS (
         SELECT sets.id AS entity_id,
            'set'::text AS entity_type,
            sets.user_id
           FROM public.sets
        ), user_icons AS (
         SELECT icons.id AS entity_id,
            'icon'::text AS entity_type,
            icons.user_id
           FROM public.icons
        ), user_illustrations AS (
         SELECT illustrations.id AS entity_id,
            'illustration'::text AS entity_type,
            illustrations.user_id
           FROM public.illustrations
        ), user_families AS (
         SELECT families.id AS entity_id,
            'family'::text AS entity_type,
            families.user_id
           FROM public.families
        ), all_user_items AS (
         SELECT user_sets.entity_id,
            user_sets.entity_type,
            user_sets.user_id
           FROM user_sets
        UNION ALL
         SELECT user_icons.entity_id,
            user_icons.entity_type,
            user_icons.user_id
           FROM user_icons
        UNION ALL
         SELECT user_illustrations.entity_id,
            user_illustrations.entity_type,
            user_illustrations.user_id
           FROM user_illustrations
        UNION ALL
         SELECT user_families.entity_id,
            user_families.entity_type,
            user_families.user_id
           FROM user_families
        )
 SELECT a.entity_id,
    a.entity_type,
    a.user_id,
    count(o.user_id) AS purchase_count
   FROM ((all_user_items a
     JOIN public.order_items oi ON (((oi.entity_id = a.entity_id) AND ((oi.entity_type)::text = a.entity_type))))
     JOIN public.orders o ON ((oi.order_id = o.id)))
  WHERE ((o.status)::text = 'completed'::text)
  GROUP BY a.entity_id, a.entity_type, a.user_id;
```

**Model**: `refs/db-models/purchases-by-entity-type.js`
- Fields: entity_id, entity_type, user_id, purchase_count
- Required: entity_id, entity_type, user_id, purchase_count
- No relations defined (view fields only)
- Read-only (database view)

**Entity**: `src/purchased-items/purchases-by-entity-type/PurchasesByEntityTypeEntity.js`
- Uses createEntityFromModel pattern ✅
- All view fields present in allowedColumns ✅

**Repository**: `src/purchased-items/purchases-by-entity-type/PurchasesByEntityTypeRepository.js`
- Standard setup with modelName 'purchasesByEntityType' ✅
- No custom methods (extends BaseRepository only)

**Service**: `src/purchased-items/purchases-by-entity-type/PurchasesByEntityTypeService.js`
- Extends BaseService directly (no mixins) ✅
- No custom methods (standard read operations only)

## Business Context
- purchases_by_entity_type is a **READ-ONLY VIEW**
- Shows purchase statistics for creators' entities (sets, icons, illustrations, families)
- Aggregates data: how many times each entity has been purchased
- Used for analytics and creator dashboards
- Cannot INSERT, UPDATE, or DELETE (view constraint)
- Data comes from underlying tables: sets/icons/illustrations/families + order_items + orders

## Implementation Plan

### 1. Test Approach for Views
Since purchases_by_entity_type is a view, we CANNOT use standard contract tests that expect create/update/delete operations.

Instead, follow the **transactions-view and purchased-items pattern**:
- Custom repository tests (read operations only)
- Seed data by inserting into underlying tables
- Test findOne, findAll, paginate, exists, count
- Test grouping and aggregation (purchase_count)
- NO entity tests (view entities are simple)
- NO service tests (if service only wraps repository)
- NO unit tests (standard BaseService/BaseRepository behavior)

### 2. Create Test Files
- `src/purchased-items/purchases-by-entity-type/__tests__/seed.js` - seedOne/seedMany functions
- `src/purchased-items/purchases-by-entity-type/__tests__/repository.test.js` - Repository read operation tests

### 3. Seed Data Strategy
**Seed by creating underlying records:**
1. Use existing entities from sets/icons/illustrations/families tables (contributor user_id: 94)
2. Create order + order_items for purchases
3. View automatically aggregates the purchase counts

**Test data:**
- Use test user IDs from TEST-STRATEGY.md:
  - Contributor (creator): id 94 (owns entities)
  - Customer (buyer): id 2722 (purchases entities)
- Entity types: 'set', 'icon', 'illustration', 'family'
- Orders must have status='completed'

**Example seed function:**
```javascript
const seedOne = async ({ trx, creator_user_id = 94, buyer_user_id = 2722, entity_type = 'icon', entity_id, opts = {} }) => {
    // 1. Get or use existing entity (owned by creator)
    // Entity already exists in database (icons/sets/illustrations/families)

    // 2. Create order for buyer
    const [order] = await trx('orders').insert({
        user_id: buyer_user_id,
        total_amount: 10.00,
        discounted_total: 10.00,
        status: 'completed',
        ...opts.orderFields
    }).returning('*');

    // 3. Create order_item linking to entity
    const [orderItem] = await trx('order_items').insert({
        order_id: order.id,
        entity_id: entity_id,
        entity_type: entity_type,
        amount: 10.00,
        discounted_amount: 10.00,
        ...opts.orderItemFields
    }).returning('*');

    // 4. Query view to get aggregated result
    const [viewRecord] = await trx('purchases_by_entity_type')
        .where({
            entity_id: entity_id,
            entity_type: entity_type,
            user_id: creator_user_id
        });

    return viewRecord;
};
```

### 4. Tests to Implement

**Repository Tests (read-only operations):**
- `findOne()` - Find by entity_id + entity_type + user_id
- `findOne()` - Find by user_id + entity_type
- `findAll()` - Get all for creator user
- `findAll()` - Filter by entity_type
- `findAll()` - Filter by entity_id
- `paginate()` - Paginate results
- `exists()` - Check if record exists
- `count()` - Count records with filters
- Verify purchase_count aggregation is correct

**NO tests for:**
- create/update/delete (view is read-only)
- Soft delete (not applicable)
- Activation (not applicable)
- Relations (none defined in model)

### 5. Edge Cases to Test
- Query by creator user_id (most common use case)
- Query by entity_type (filter by icons, sets, etc.)
- Verify purchase_count increments correctly with multiple purchases
- Verify only 'completed' orders are counted
- Empty results (creator with no purchases)
- Multiple entity types for same creator

### 6. Real Data Usage
- Use stable test users from TEST-STRATEGY.md (ids: 94, 2722)
- Use real entity_ids from products tables (icons, sets, illustrations, families)
- All tests run in transactions that rollback
- View automatically aggregates purchase counts

## Time Estimates
- seed.js: 20 minutes (complex - needs to handle existing entities + create purchases)
- repository.test.js: 30 minutes (custom tests, aggregation verification)
- Running tests and fixes: 15 minutes
- **Total: ~65 minutes**

## Test Command
```bash
npm test -- src/purchased-items/purchases-by-entity-type/__tests__/
```

## Expected Results
- Repository tests: ~12-15 tests passing
- **Total: ~12-15 tests passing**
- No skipped tests (custom tests, not contracts)
- No failures

## Notes
- This is a **VIEW**, not a table - read-only operations only
- Follow transactions-view and purchased-items pattern
- Seed by inserting into orders + order_items (entities already exist)
- View automatically aggregates purchase counts per creator entity
- No entity/service tests needed for simple views
- Verify aggregation logic (GROUP BY, COUNT) works correctly
