# Payment-Types Tests Implementation Task

## Objective
Create comprehensive contract tests for the payment-types module

## Current State Analysis

### Model (refs/db-models/payment-types.js)
- Fields: id, type, description
- Required: type
- type field uses enum from enums.paymentTypes
- No timestamps (created_at, updated_at)
- Relation: transaction (BelongsToOne to transactions)

### PaymentTypeEntity.js
- ✅ Using correct model: `DB.paymentTypes`
- ✅ Correct allowedColumns: id, type, description
- ❌ Missing relatedEntities (should have transaction relation)

## Implementation Plan

### 1. Update PaymentTypeEntity.js
- [ ] Add relatedEntities:
  - transaction: () => require('../TransactionEntity')

### 2. Create seed.js
- [ ] Return payment_type data with:
  - type (from enums.paymentTypes, e.g., 'credit_card')
  - description (test description)
- [ ] Note: No need to create transactions for basic tests

### 3. Create entity.test.js
- [ ] seedOne function with type and description
- [ ] makeRelations function (transaction: null or skip if not needed)
- [ ] updateOne function for cloneWith test (update description)
- [ ] Use entityContract

### 4. Create repository.test.js
- [ ] initRepository function
- [ ] whereForUnique: if id exists return {id}, else return {type} (type is unique)
- [ ] whereForExisting: {id}
- [ ] Configure: supportsRelations, supportsFindAll, supportsPaginate, supportsExists

### 5. Create service.test.js
- [ ] Use initPaymentTypeService from index.js
- [ ] Same whereForUnique and whereForExisting as repository
- [ ] Configure: supportsRelations, supportsSoftDelete: false, supportsActivation: false, supportsGetAll, skipGetActive

### 6. Run Tests
- [ ] Run all payment-types tests
- [ ] Verify all passing (expect ~29 passed, 2 skipped)
- [ ] Fix any failures

### 7. Create PR
- [ ] Create branch: claude/payment-types-tests
- [ ] Commit changes with proper message
- [ ] Push and create PR with summary (wait for approval before pushing)

## Expected Test Coverage
- Entity contract tests (5 tests including cloneWith)
- Repository contract tests
- Service contract tests
- Unique constraint on 'type' field

## Notes
- payment-types is a simple lookup table
- type field is unique (likely has unique constraint)
- No timestamps in the model (only id, type, description)
- May not need to test with actual transaction relations
