IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create tests for purchased-items view

## Goal
Add custom tests for purchased-items view (read-only database view, not a table).

## Module Analysis

### Purchased Items View
**SQL View**: `refs/db-models/purchased-items.sql`
```sql
CREATE VIEW purchased_items AS
SELECT oi.id,
    oi.entity_id,
    oi.entity_type,
    o.user_id,
    oi.created_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id;
```

**Model**: `refs/db-models/purchased-items.js`
- Fields: id, entity_id, entity_type, user_id, created_at
- Required: entity_id, entity_type, user_id
- No relations defined (view fields only)
- Read-only (database view)

**Entity**: `src/purchased-items/PurchasedItemsEntity.js`
- Uses createEntityFromModel pattern ✅
- All view fields present in model ✅

**Repository**: `src/purchased-items/PurchasedItemsRepository.js`
- Standard setup with modelName 'purchasedItems' ✅
- No custom methods (extends BaseRepository only)

**Service**: `src/purchased-items/PurchasedItemsService.js`
- Extends BaseService directly (no mixins) ✅
- No custom methods (standard read operations only)

## Business Context
- purchased_items is a **READ-ONLY VIEW** joining order_items with orders
- Shows which entities (icons, illustrations, etc.) users have purchased
- Used for checking purchase status and download permissions
- Cannot INSERT, UPDATE, or DELETE (view constraint)
- Data comes from underlying order_items and orders tables

## Implementation Plan

### 1. Test Approach for Views
Since purchased_items is a view, we CANNOT use standard contract tests that expect create/update/delete operations.

Instead, follow the **transactions-view pattern**:
- Custom repository tests (read operations only)
- Seed data by inserting into underlying tables (orders + order_items)
- Test findOne, findAll, paginate, exists
- Test any relations if defined
- NO entity tests (view entities are simple)
- NO service tests (if service only wraps repository)
- NO unit tests (standard BaseService/BaseRepository behavior)

### 2. Create Test Files
- `src/purchased-items/__tests__/seed.js` - seedOne/seedMany functions
- `src/purchased-items/__tests__/repository.test.js` - Repository read operation tests

### 3. Seed Data Strategy
**Seed by creating underlying records:**
1. Create order record in orders table (with user_id)
2. Create order_item record in order_items table (with order_id, entity_id, entity_type)
3. View will automatically show the joined data

**Test data:**
- Use test user IDs: 1 (admin), 94 (contributor), 2722 (customer)
- Use existing entity_ids from products (icons, illustrations, etc.)
- Entity types: 'icon', 'illustration', 'set', 'family'
- Orders should have valid status and payment info

**Example seed function:**
```javascript
const seedOne = async ({ trx, user_id = 1, entity_type = 'icon', opts = {} }) => {
    // 1. Create order
    const [order] = await trx('orders').insert({
        user_id: user_id,
        total: 10.00,
        status: 'completed',
        payment_type_id: 1,
        ...opts.orderFields
    }).returning('*');

    // 2. Create order_item
    const [orderItem] = await trx('order_items').insert({
        order_id: order.id,
        entity_id: opts.entity_id || 1,
        entity_type: entity_type,
        price: 10.00,
        ...opts.orderItemFields
    }).returning('*');

    // 3. Query view to get result
    const [viewRecord] = await trx('purchased_items')
        .where({ id: orderItem.id });

    return viewRecord;
};
```

### 4. Tests to Implement

**Repository Tests (read-only operations):**
- `findOne()` - Find by id
- `findOne()` - Find by user_id + entity_type
- `findOne()` - Find by user_id + entity_id
- `findAll()` - Get all for user
- `findAll()` - Filter by entity_type
- `findAll()` - Filter by entity_id
- `paginate()` - Paginate results
- `exists()` - Check if record exists (user owns entity)
- `exists()` - Return false for non-existent

**NO tests for:**
- create/update/delete (view is read-only)
- Soft delete (not applicable)
- Activation (not applicable)
- Relations (none defined in model)

### 5. Edge Cases to Test
- Query by user_id (most common use case)
- Query by entity_type (filter by icons, illustrations, etc.)
- Query by user_id + entity_id (check if user owns specific entity)
- Pagination with large result sets
- Empty results (user has no purchases)
- Multiple purchases of same entity_type

### 6. Real Data Usage
- Use stable test users from TEST-STRATEGY.md (ids: 1, 94, 2722)
- Use real entity_ids from products tables
- All tests run in transactions that rollback
- View automatically reflects underlying table changes

## Time Estimates
- seed.js: 15 minutes (more complex - inserts into 2 tables)
- repository.test.js: 30 minutes (custom tests, no contracts)
- Running tests and fixes: 15 minutes
- **Total: ~60 minutes**

## Test Command
```bash
npm test -- src/purchased-items/__tests__/
```

## Expected Results
- Repository tests: ~12-15 tests passing
- **Total: ~12-15 tests passing**
- No skipped tests (custom tests, not contracts)
- No failures

## Notes
- This is a **VIEW**, not a table - read-only operations only
- Follow transactions-view pattern, not standard contract tests
- Seed by inserting into orders + order_items tables
- View automatically shows joined data
- No entity/service tests needed for simple views
