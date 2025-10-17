IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for protected-entities module

## Goal
Add contract-based tests for protected-entities module using the established contract testing pattern.

## Module Analysis

### Protected Entities Module
**Model**: `refs/db-models/protected-entities.js`
- Fields: id, entity_id, entity_type
- Required: entity_id, entity_type
- entity_type enum: 'user', 'user_role', 'team_type', 'product_type', 'team'
- Relations: None defined in model

**Entity**: `src/protected-entities/ProtectedEntitiesEntity.js`
- All model fields present in allowedColumns ✅
- Has relatedEntities for user ✅
- Note: Comment says "favorite item" (copy-paste error, but doesn't affect functionality)

**Service**: Expected to support standard CRUD operations

## Implementation Plan

### 1. Create Test Files
- `src/protected-entities/__tests__/seed.js` - seedOne, seedMany, seedEntity
- `src/protected-entities/__tests__/entity.test.js` - Entity contract tests
- `src/protected-entities/__tests__/repository.test.js` - Repository contract tests
- `src/protected-entities/__tests__/service.test.js` - Service contract tests

### 2. Seed Data Considerations
**Protected Entities:**
- Needs valid entity_id (use entity_id = testCounter)
- Needs valid entity_type from enum
- Simple tracking table without timestamps
- No unique constraints beyond primary key
- No is_active field (no activation support)

## Test Command
```bash
npm run test src/protected-entities/__tests__/
```

## Expected Results
- 3 test suites, ~25 tests (no activation tests since no is_active field)
- Tests relations to user entity
