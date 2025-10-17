IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for image-types module

## Goal
Add contract-based tests for image-types module using the established contract testing pattern.

## Module Analysis

### Image Types Module
**Model**: `refs/db-models/image-types.js`
- Fields: id, label, value, description, created_at, updated_at
- Required: label, value, description
- Unique constraint on `value` field
- No enums
- No relations
- Has timestamps (created_at, updated_at)
- No is_deleted field (no soft delete support)
- No is_active field (no activation support)

**Entity**: `src/images/image-types/ImageTypeEntity.js`
- All model fields present in allowedColumns ✅

**Repository**: `src/images/image-types/ImageTypeRepository.js`
- Standard setup with modelName 'imageTypes' ✅

**Service**: `src/images/image-types/ImageTypeService.js`
- Extends BaseService directly (no mixins) ✅
- Standard CRUD operations only

## Implementation Plan

### 1. Create Test Files
- `src/images/image-types/__tests__/seed.js` - seedOne function
- `src/images/image-types/__tests__/entity.test.js` - Entity contract tests
- `src/images/image-types/__tests__/repository.test.js` - Repository contract tests
- `src/images/image-types/__tests__/service.test.js` - Service contract tests + custom tests

### 2. Seed Data Considerations
**Image Types:**
- All fields required: label, value, description
- value must be unique (UNIQUE constraint)
- Use test counter to generate unique values: `test_type_${counter}`
- No foreign key dependencies
- No is_deleted field (no soft delete)
- No is_active field (no activation)

### 3. Contract Configuration
```javascript
serviceContract({
    name: 'ImageType',
    initService: initImageTypeService,
    Entity: ImageTypeEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
});
```

### 4. Custom Tests Needed
- Unique value constraint enforcement
- Duplicate value prevention on create
- Duplicate value prevention on update
- Query by value (common lookup pattern)
- Query by label
- Timestamp tracking (createdAt, updatedAt)

## Test Command
```bash
npm run test src/images/image-types/__tests__/
```

## Expected Results
- 3 test suites, ~25-30 tests total
- No soft delete tests (no is_deleted field)
- No activation tests (no is_active field)
- Tests for unique constraint on value field
- Tests for timestamp handling
