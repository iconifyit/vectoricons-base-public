# Transaction-Categories Tests Implementation Task

## Objective
Create comprehensive contract tests for the transaction-categories module

## Current State Analysis

### Model (refs/db-models/transaction-categories.js)
- Fields: id, value, label, created_at, updated_at
- Required: value, label
- Has timestamps (created_at, updated_at)
- Relation: transactions (HasManyRelation to transactions)

### TransactionCategoryEntity.js
- ✅ Using correct model: `DB.transactionCategories`
- ✅ Correct allowedColumns: id, value, label, created_at, updated_at
- ⚠️ Has relatedEntities: transactions (plural)
- **ISSUE TO CONSIDER**: Same as transaction-types - loading all transactions for a category could be massive

## Design Decision

Similar to transaction-types, this is a lookup/reference table. Should we remove the `transactions` relation?

**Considerations:**
- Categories are likely few in number (e.g., "purchase", "refund", "credit", "adjustment")
- Loading all transactions for a category would be massive and not paginated
- One-way FK from transactions → transaction-categories is sufficient
- Unlike transaction-types (only 2 values), categories might have more entries but still a manageable lookup table

**Recommendation**: Remove the `transactions` relation for same reasons as transaction-types.

## Implementation Plan

### 1. Update TransactionCategoryEntity
- [ ] Remove relatedEntities (set to empty object)
- [ ] Keep as simple lookup table
- [ ] User will update DB model and refs to remove relation

### 2. Create seed.js
- [ ] Return transaction_category data with:
  - value: unique string (e.g., 'purchase', 'refund', 'credit')
  - label: human-readable label
- [ ] Include timestamps (created_at, updated_at)

### 3. Create entity.test.js
- [ ] seedOne function with value, label, timestamps
- [ ] No makeRelations needed (if we remove relations)
- [ ] updateOne function for cloneWith test (update label)
- [ ] Use entityContract

### 4. Create repository.test.js
- [ ] initRepository function
- [ ] whereForUnique: if id exists return {id}, else return {value} (value likely unique)
- [ ] whereForExisting: {id}
- [ ] Configure: supportsRelations: false, supportsFindAll, supportsPaginate, supportsExists

### 5. Create service.test.js
- [ ] Use initTransactionCategoryService from index.js
- [ ] Same whereForUnique and whereForExisting as repository
- [ ] Configure: supportsRelations: false, supportsSoftDelete: false, supportsActivation: false, supportsGetAll, skipGetActive

### 6. Run Tests
- [ ] Run all transaction-categories tests
- [ ] Verify all passing (expect ~29 passed, 2 skipped)
- [ ] Fix any failures

### 7. Commit Changes
- [ ] Commit to branch: claude/transaction-categories-tests
- [ ] Wait for user approval before creating PR

## Questions to Resolve Before Implementation
1. **Remove relations?**: Should we remove the transactions relation like we did for transaction-types?
2. **Unique constraint**: Is value the unique field for whereForUnique?
3. **Sample values**: What are typical category values? (purchase, refund, credit, adjustment?)

## Expected Test Coverage
- Entity contract tests (5 tests including cloneWith)
- Repository contract tests
- Service contract tests
- Timestamps support (created_at, updated_at)

## Notes
- transaction-categories is a lookup table (more entries than transaction-types but still manageable)
- Has timestamps unlike transaction-types
- value field is likely unique (business key)
- Similar pattern to payment-types and transaction-types
