IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for downloads module

## Goal
Add contract-based tests for downloads module using the established contract testing pattern.

## Module Analysis

### Downloads Module
**Model**: `refs/db-models/downloads.js`
- Fields: id, user_id, entity_type, entity_unique_id, unique_id, object_key, ip, created_at, updated_at
- No required fields specified in schema
- No unique constraints
- No enums
- Has relation: belongsToOne user
- Has timestamps (created_at, updated_at)
- No is_deleted field (no soft delete support)
- No is_active field (no activation support)

**Entity**: `src/downloads/DownloadEntity.js`
- All model fields present in allowedColumns ✅
- Has user relation configured ✅

**Repository**: `src/downloads/DownloadRepository.js`
- Standard setup with modelName 'downloads' ✅
- Custom methods: findByEntity, findByObjectKey ✅

**Service**: `src/downloads/DownloadService.js`
- Extends BaseService directly (no mixins) ✅
- Custom methods: getDownloadsByUserId, getDownloadsByEntity, getRecentDownloadsByIP ✅

## Business Context
- Downloads table tracks S3 zip files for purchased sets
- When user purchases a set, system creates signed URL with expiration
- Individual image purchases use direct S3 URLs (not tracked in downloads)
- Family purchases get individual set links (no bundled downloads)
- Tests should use real data with user_id: 1

## Implementation Plan

### 1. Create Test Files
- `src/downloads/__tests__/seed.js` - seedOne function
- `src/downloads/__tests__/entity.test.js` - Entity contract tests
- `src/downloads/__tests__/repository.test.js` - Repository contract tests
- `src/downloads/__tests__/service.test.js` - Service contract tests + custom tests

### 2. Seed Data Considerations
**Downloads:**
- No required fields (all optional)
- No unique constraints
- Use testCounter for unique values
- Fields:
  - user_id: 1 (real user for testing)
  - entity_type: 'set'
  - entity_unique_id: `test_set_${counter}`
  - unique_id: `test_unique_${counter}`
  - object_key: `test/user1/set_${counter}.zip`
  - ip: `192.168.1.${counter % 255}`
- No is_deleted field (no soft delete)
- No is_active field (no activation)

### 3. Contract Configuration
```javascript
serviceContract({
    name: 'Download',
    initService: initDownloadService,
    Entity: DownloadEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ unique_id: data.unique_id }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
});
```

### 4. Custom Tests Needed
- Query by user_id (use real user_id: 1)
- Query by entity_type + entity_unique_id (use real set data)
- Query by object_key
- getRecentDownloadsByIP with time windows
- Create download with real set data from user_id: 1
- User relation loading
- Bulk operations
- Timestamp tracking (createdAt, updatedAt)

### 5. Real Data Usage
- Use user_id: 1 for all real data queries
- Query families, sets, icons with WHERE clause {user_id: 1} to limit result sets
- Use actual set's unique_id for entity_unique_id in tests
- No illustrations needed (user 1 doesn't have any)

## Test Command
```bash
npm run test src/downloads/__tests__/
```

## Expected Results
- 3 test suites, ~30-35 tests total
- No soft delete tests (no is_deleted field)
- No activation tests (no is_active field)
- Tests for timestamp handling
- Tests for user relation
- Tests for custom query methods
