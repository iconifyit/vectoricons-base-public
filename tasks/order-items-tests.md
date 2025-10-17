# Order-Items Tests Implementation Task

## Objective
Create comprehensive contract tests for the order-items module

## Current State Analysis

### Database Schema (order-items-schema.sql)
- Fields: id, order_id, entity_id, entity_type, cart_item_id, amount, discounted_amount, created_at, updated_at
- Polymorphic pattern: entity_id + entity_type
- References: orders(id), cart_items(id)

### Issues Found in OrderItemEntity.js
- ❌ Using wrong model: `DB.orders` instead of `DB.orderItems`
- ❌ Has wrong fields: includes user_id, cart_id, total_amount, order_date, status (these are order fields, not order_item fields)
- ❌ Missing fields: order_id, entity_id, entity_type, cart_item_id, amount, discounted_amount
- ❌ Wrong relatedEntities

## Implementation Plan

### 1. Fix OrderItemEntity.js
- [ ] Change model from `DB.orders` to `DB.orderItems`
- [ ] Update allowedColumns to match schema:
  - id
  - order_id
  - entity_id
  - entity_type
  - cart_item_id
  - amount
  - discounted_amount
  - created_at
  - updated_at
- [ ] Fix relatedEntities:
  - order: () => require('../OrderEntity') (BelongsToOne)
  - cartItem: () => require('../../carts/cart-items/CartItemEntity') (BelongsToOne)

### 2. Create seed.js
- [ ] Create an order (which creates a cart with user_id=1)
- [ ] Return order_item data with:
  - order_id (from created order)
  - entity_id (test value, e.g., 100 + testCounter)
  - entity_type ('icon')
  - amount (e.g., 10.00 + testCounter)
  - discounted_amount (e.g., 9.00 + testCounter)
  - cart_item_id (optional, can be null)

### 3. Create entity.test.js
- [ ] Set up with actual order in beforeAll
- [ ] seedOne function with proper fields
- [ ] makeRelations function (order relation required)
- [ ] updateOne function for cloneWith test (update amount and discounted_amount)
- [ ] Use entityContract

### 4. Create repository.test.js
- [ ] initRepository function
- [ ] whereForUnique: if id exists return {id}, else return {order_id, entity_id, entity_type}
- [ ] whereForExisting: {id}
- [ ] Configure: supportsRelations, supportsFindAll, supportsPaginate, supportsExists

### 5. Create service.test.js
- [ ] Use initOrderItemService from index.js
- [ ] Same whereForUnique and whereForExisting as repository
- [ ] Configure: supportsRelations, supportsSoftDelete: false, supportsActivation: false, supportsGetAll, skipGetActive

### 6. Run Tests
- [ ] Run all order-items tests
- [ ] Verify all passing (expect ~29 passed, 2 skipped)
- [ ] Fix any failures

### 7. Create PR
- [ ] Create branch: claude/order-items-tests
- [ ] Commit changes with proper message
- [ ] Push and create PR with summary

## Expected Test Coverage
- Entity contract tests (5 tests including cloneWith)
- Repository contract tests
- Service contract tests
- All upsert logic working correctly with polymorphic unique constraints

## Notes
- Order-items uses polymorphic pattern (entity_id + entity_type)
- Unique constraint is likely: order_id + entity_id + entity_type
- cart_item_id is optional (can be null)
