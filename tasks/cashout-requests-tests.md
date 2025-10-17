IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for cashout-requests module

## Goal
Add contract-based tests and unit tests for cashout-requests module using the established contract testing pattern.

## Module Analysis

### Cashout Requests Module
**Model**: `refs/db-models/cashout-requests.js`
- Fields: id, user_id, amount, approver_id, transaction_id, status, email, memo, method, created_at, updated_at
- Required: user_id, amount, status, email, method
- No unique constraints
- No enums
- Has relation: belongsToOne user
- Has timestamps (created_at, updated_at)
- No is_deleted field (no soft delete support)
- No is_active field (no activation support)

**Entity**: `src/cashout-requests/CashoutRequestEntity.js`
- All model fields present in allowedColumns ✅
- Has user relation configured ✅

**Repository**: `src/cashout-requests/CashoutRequestRepository.js`
- Standard setup with modelName 'cashoutRequests' ✅
- No custom methods (extends BaseRepository only)

**Service**: `src/cashout-requests/CashoutRequestService.js`
- Extends BaseService directly (no mixins) ✅
- No custom methods (standard CRUD only)

## Business Context
- Cashout requests track contributor requests to withdraw earnings
- Required fields: user_id, amount, status, email, method
- Status values: pending, approved, rejected, completed
- Amount is numeric(10,2) - supports cents precision
- Email field stores payout destination email
- Method field stores payout method (paypal, stripe, etc)
- Approver_id tracks who approved the request
- Transaction_id links to payment processor transaction

## Implementation Plan

### 1. Create Test Files
- `src/cashout-requests/__tests__/seed.js` - seedOne function
- `src/cashout-requests/__tests__/entity.test.js` - Entity contract tests
- `src/cashout-requests/__tests__/repository.test.js` - Repository contract tests
- `src/cashout-requests/__tests__/service.test.js` - Service contract tests
- `src/cashout-requests/__tests__/entity.unit.test.js` - Entity unit tests
- `src/cashout-requests/__tests__/repository.unit.test.js` - Repository unit tests
- `src/cashout-requests/__tests__/service.unit.test.js` - Service unit tests

### 2. Seed Data Considerations
**Cashout Requests:**
- Required fields: user_id, amount, status, email, method
- Use test user IDs: 1 (admin), 94 (contributor), 2722 (customer)
- Amount: use realistic values (10.00, 50.00, 100.00)
- Status: use 'pending', 'approved', 'completed'
- Email: generate test emails (test{counter}@example.com)
- Method: use 'paypal', 'stripe'
- Optional fields: approver_id (use 1 for admin), transaction_id, memo
- No is_deleted field (no soft delete)
- No is_active field (no activation)

### 3. Contract Configuration
```javascript
serviceContract({
    name: 'CashoutRequest',
    initService: initService,
    Entity: CashoutRequestEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ id: data.id }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
});
```

### 4. Tests to Implement

**Contract/Integration Tests:**
- Entity: constructor, toJSON, field mapping, relation materialization
- Repository: findAll, findById, create, update, delete, upsert, exists, count, paginate
- Service: getAll, getById, create, update, delete, upsert, exists, paginate

**Unit Tests:**
- Entity: constructor with all fields, toJSON serialization, snake_case conversion, relations
- Repository: initialization, entity wrapping, query builder access, inheritance
- Service: initialization, API surface, inheritance

### 5. Real Data Usage
- Use stable test users from TEST-STRATEGY.md
- Query with WHERE {user_id: 94} to get contributor cashout requests
- No seeding beyond what's needed for tests
- All tests run in transactions that rollback

### 6. Edge Cases to Test
- Creating with all required fields
- Creating with optional fields (approver_id, transaction_id, memo)
- Querying by user_id
- Querying by status
- User relation loading
- Timestamp tracking (createdAt, updatedAt)
- Update operations
- Delete operations

## Time Estimates
- seed.js: 5 minutes
- entity.test.js: 5 minutes
- repository.test.js: 5 minutes
- service.test.js: 5 minutes
- entity.unit.test.js: 10 minutes
- repository.unit.test.js: 10 minutes
- service.unit.test.js: 10 minutes
- Running tests and fixes: 10 minutes
- **Total: ~60 minutes**

## Test Command
```bash
npm test -- src/cashout-requests/__tests__/
```

## Expected Results
- Entity tests: ~14 tests passing
- Repository tests: ~17 tests passing
- Service tests: ~9 tests passing
- Entity unit tests: ~14 tests passing
- Repository unit tests: ~12 tests passing
- Service unit tests: ~15 tests passing
- **Total: ~81 tests passing**
- 3 skipped tests (soft delete/activation not supported)
- No failures
