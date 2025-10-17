IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for images module

## Goal
Add contract-based tests for images module using the established contract testing pattern.

## Module Analysis

### Images Module
**Model**: `refs/db-models/images.js`
- Fields: id, entity_id, entity_type, image_type_id, image_hash, visibility, access, name, file_type, url, unique_id, created_at, updated_at, is_deleted
- Required: entity_id, entity_type, image_type_id, visibility, access, name, file_type, url
- Has enums for: entity_type (ImageEntityTypes), visibility (Visibility), access (ImageAccessLevels), file_type (AllowedImageFileTypes)
- Relations: imageTypes (BelongsToOne to image-types)
- Has is_deleted field (soft delete support)
- No is_active field (no activation support)

**Entity**: `src/images/ImageEntity.js`
- All model fields present in allowedColumns ✅
- Has relatedEntities for imageTypes ✅

**Repository**: `src/images/ImageRepository.js`
- Standard setup with modelName 'images' ✅

**Service**: Expected to support soft delete and standard CRUD operations

## Implementation Plan

### 1. Create Test Files
- `src/images/__tests__/seed.js` - seedOne, seedMany, seedEntity
- `src/images/__tests__/entity.test.js` - Entity contract tests
- `src/images/__tests__/repository.test.js` - Repository contract tests
- `src/images/__tests__/service.test.js` - Service contract tests

### 2. Seed Data Considerations
**Images:**
- Needs valid entity_type, entity_id, image_type_id (use existing image_type_id = 1)
- Needs valid visibility, access, file_type from enums
- Needs unique_id for uniqueness
- Has is_deleted field (soft delete support)
- No is_active field (no activation support)
- Use entity_id starting from 10000 to avoid conflicts

## Test Command
```bash
npm run test src/images/__tests__/
```

## Expected Results
- 3 test suites, ~25-30 tests
- Tests soft delete operations
- Tests relation to imageTypes
- No activation tests (no is_active field)
