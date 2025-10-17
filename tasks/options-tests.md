IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for options module

## Goal
Add contract-based tests for options module using the established contract testing pattern.

## Module Analysis

### Options Module
**Model**: `refs/db-models/options.js`
- Fields: id, entity_type, entity_id, key, value, created_at
- Required: entity_type, entity_id, key, value
- Relations: None defined in model
- No is_active field (no activation support)
- No updated_at field

**Entity**: `src/options/OptionEntity.js`
- **ISSUE**: Currently using DB.favorites model instead of DB.options
- **ISSUE**: Has wrong allowedColumns (includes user_id, updated_at, is_active which don't exist in options table)
- **ISSUE**: Has relatedEntities for user (model has no relations)
- **Fix needed**: Update to use DB.options model and correct fields

**Repository**: `src/options/OptionRepository.js`
- **ISSUE**: Using modelName 'favorites' instead of 'options'
- **Fix needed**: Update modelName to 'options'

**Service**: Expected to support standard CRUD operations

## Implementation Plan

### 1. Fix Entity and Repository
Update OptionEntity to:
- Use DB.options model
- Correct allowedColumns: id, entity_type, entity_id, key, value, created_at
- Remove relatedEntities (model has no relations)

Update OptionRepository to:
- Use modelName 'options' instead of 'favorites'

### 2. Create Test Files
- `src/options/__tests__/seed.js` - seedOne, seedMany, seedEntity
- `src/options/__tests__/entity.test.js` - Entity contract tests
- `src/options/__tests__/repository.test.js` - Repository contract tests
- `src/options/__tests__/service.test.js` - Service contract tests

### 3. Seed Data Considerations
**Options:**
- Needs valid entity_type, entity_id, key, value
- Simple key-value storage table
- No unique constraints beyond primary key
- No is_active field (no activation support)
- Has created_at but no updated_at

## Test Command
```bash
npm run test src/options/__tests__/
```

## Expected Results
- 3 test suites, ~25 tests (no activation tests since no is_active field)
- No relation tests (model has no relationMappings)
