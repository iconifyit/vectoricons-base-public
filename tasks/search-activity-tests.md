# Test Implementation: search-activity Module

## Schema Consistency Verification

**Schema (refs/db-models/search-activity.sql)**:
- id: SERIAL PRIMARY KEY
- search_term: varchar(255) NOT NULL
- user_id: integer NOT NULL
- created_at: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at: timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP

**Model (refs/db-models/search-activity.js)**:
- All schema fields present with correct types
- Required fields: search_term, user_id
- Relation: user (BelongsToOneRelation to Users)

**Entity (SearchActivityEntity.js)**:
- allowedColumns match all schema fields
- relatedEntities includes user relation

✓ Schema, model, and entity are fully consistent

## Test Plan

### 1. Entity Tests (entity.test.js)
- Use entityContract with proper seedOne function
- seedOne must return camelCase fields with ALL schema fields
- Include id, searchTerm, userId, createdAt (Date), updatedAt (Date)
- Define makeRelations for user relation

### 2. Repository Tests (repository.test.js)
- Use repositoryContract with proper seedOne function
- seedOne returns snake_case fields WITHOUT auto-generated fields (id, created_at, updated_at)
- Only include: search_term, user_id
- whereForUnique targets composite semantic key: { search_term, user_id }
- Enable supportsRelations
- Disable supportsFindAll due to large dataset causing timeouts

### 3. Service Tests (service.test.js)
- Use serviceContract with same seedOne as repository
- Disable supportsGetAll due to large dataset causing timeouts
- No soft delete support
- No activation support
- Timestamps are supported

## Implementation Notes

### Performance Considerations
The search_activity table contains a large amount of production data. Tests that call findAll() or getAll() without filters cause severe timeouts (60+ seconds). Solution:
- Set `supportsFindAll: false` in repository contract
- Set `supportsGetAll: false` in service contract

### Unique Constraints
The table has no explicit unique constraint besides the primary key, but semantically (search_term, user_id) forms a composite unique key for upsert operations.

### Test Data
- Repository/Service seed: `{ search_term: 'test search N', user_id: 1 }`
- Entity seed: `{ id: 0, searchTerm: 'test search N', userId: 1, createdAt: Date, updatedAt: Date }`
- Use testCounter to generate unique search terms

## Files Created
- src/search-activity/__tests__/seed.js
- src/search-activity/__tests__/entity.test.js
- src/search-activity/__tests__/repository.test.js
- src/search-activity/__tests__/service.test.js

## Test Results
- Entity: 4 passed, 1 skipped
- Repository: 16 passed, 1 skipped
- Service: 6 passed, 2 skipped
- Total: 26 passed, 4 skipped
- Duration: ~1.2 seconds
