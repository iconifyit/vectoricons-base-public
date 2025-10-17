# Transaction-Types Tests Implementation Task

## Objective
Create comprehensive contract tests for the transaction-types module

## Current State Analysis

### Schema (refs/db-models/transaction-types-schema.sql)
- Fields: id (SERIAL PRIMARY KEY), label (varchar NOT NULL), operation (integer NOT NULL)
- No timestamps (created_at, updated_at)
- Unique index on id

### Model (refs/db-models/transaction-types.js)
- Fields: id, label, operation
- Required: label
- label field uses enum: ['credit', 'debit']
- operation field is integer
- Relation: transactionItem (BelongsToOneRelation to transaction_items)

### TransactionTypeEntity.js
- ✅ Using correct model: `DB.transactionTypes`
- ✅ Correct allowedColumns: id, label, operation
- ⚠️ Has relatedEntities: transactions (plural) - but model has transactionItem (singular)
- **ISSUE TO RESOLVE**: Relation name mismatch between model and Entity

## Implementation Plan

### 1. Update TransactionTypeEntity
- [ ] Remove relatedEntities entirely (set to empty object)
- [ ] This is a simple lookup table - no need to load potentially thousands of transaction items
- [ ] One-way FK from transaction-items → transaction-types is sufficient
- [ ] User will update DB model and refs to remove relation

### 2. Create seed.js
- [ ] Return transaction_type data with:
  - label: 'credit' or 'debit' (from enum)
  - operation: 1 for credit, -1 for debit (assumed based on naming)
- [ ] Note: No timestamps needed

### 3. Create entity.test.js
- [ ] seedOne function with label and operation
- [ ] No makeRelations needed (no relations)
- [ ] updateOne function for cloneWith test (update operation value)
- [ ] Use entityContract

### 4. Create repository.test.js
- [ ] initRepository function
- [ ] whereForUnique: if id exists return {id}, else return {label} (label likely unique)
- [ ] whereForExisting: {id}
- [ ] Configure: supportsRelations: false, supportsFindAll, supportsPaginate, supportsExists

### 5. Create service.test.js
- [ ] Use initTransactionTypeService from index.js
- [ ] Same whereForUnique and whereForExisting as repository
- [ ] Configure: supportsRelations: false, supportsSoftDelete: false, supportsActivation: false, supportsGetAll, skipGetActive

### 6. Run Tests
- [ ] Run all transaction-types tests
- [ ] Verify all passing (expect ~29 passed, 2 skipped)
- [ ] Fix any failures

### 7. Commit Changes
- [ ] Commit to branch: claude/transaction-types-tests
- [ ] Wait for user approval before creating PR

## Questions to Resolve Before Implementation
1. ~~**Relation name**: Should Entity use 'transactions' (plural) or 'transactionItem' (singular)?~~ **RESOLVED**: Remove relations entirely
2. **Operation values**: What should operation be? (Assuming 1 for credit, -1 for debit)
3. **Unique constraint**: Is label the unique field for whereForUnique? (Assuming yes)

## Expected Test Coverage
- Entity contract tests (5 tests including cloneWith)
- Repository contract tests
- Service contract tests
- Enum constraint on 'label' field ('credit', 'debit')

## Notes
- transaction-types is a simple lookup table (similar to payment-types)
- label field has enum constraint: ['credit', 'debit']
- operation is an integer (likely 1 for credit, -1 for debit based on convention)
- No timestamps in the model
