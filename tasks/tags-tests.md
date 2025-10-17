# Tags Tests

## Objective
Create comprehensive tests for the tags module (product tag lookup with unique names, activation, and timestamps) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/tags-tests`
- [x] Analyze Tag module structure
- [x] Write this task file

### 2. Test Structure
- [x] Fix TagEntity allowedColumns (camelCase)
- [x] Fix TagService (add withActivatable mixin)
- [x] Create comprehensive tests:
  - [x] entity.test.js
  - [x] repository.test.js
  - [x] service.test.js

### 3. Module Analysis

**Entity Details:**
- **Entity**: TagEntity
- **Fields** (5 total):
  - id (primary key)
  - name (varchar 255, UNIQUE)
  - is_active (boolean, default true)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)
- **Relations**:
  - entityToTags (one-to-many)
- **Purpose**: Lookup table for product tags with unique names, activation, and timestamps

**Repository:**
- **Repository**: TagRepository (extends BaseRepository)
- **Model Name**: 'tags'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: TagService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)
- **Required Fix**: Add `withActivatable` mixin for is_active support

**Test Data Strategy:**
- Lookup table with unique name constraint
- Has timestamps (created_at, updated_at)
- No soft delete
- Test unique constraint violations
- Test activation/deactivation

**Contract Configuration:**
- `supportsSoftDelete: false` - No is_deleted field
- `supportsActivation: true` - Has is_active field
- `supportsTimestamps: true` - Has created_at/updated_at
- `whereForUnique: (data) => ({ name: data.name })` - Unique by name
- `supportsRelations: false` - Skip relation testing

### 4. Test Coverage

**Entity Tests:**
- Field mapping for 5 fields (camelCase)
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation definitions (entityToTags)

**Repository Tests:**
- Standard CRUD operations via contract
- Verify correct model wiring (tags)
- Test timestamp behavior
- Test unique name constraint

**Service Tests - Contract:**
- Standard service operations via contract
- No soft delete tests
- Activation/deactivation tests
- Timestamp tests

**Service Tests - Custom (Tag Management):**

1. **Unique Name Constraint:**
   - Test creating tags with same name fails
   - Test updating to duplicate name fails
   - Test case sensitivity

2. **Activation Management:**
   - Test activate()/deactivate() methods
   - Test toggleActive() method
   - Test getActive() returns only active records
   - Test filtering by is_active

3. **Tag Operations:**
   - Test creating tags with unique names
   - Test finding by name
   - Test finding by id
   - Test listing all tags
   - Test filtering active vs inactive

4. **Bulk Operations:**
   - Test creating multiple tags
   - Test bulk activation/deactivation
   - Test filtering operations

5. **Timestamp Tracking:**
   - Test created_at is set on creation
   - Test updated_at is set on creation
   - Test updated_at changes on update

### 5. Validation Rules
- **Name**: Required, unique, max 255 chars
- **is_active**: Boolean, defaults to true
- **Timestamps**: Automatically managed
- **No soft delete**: Records are permanent or hard deleted
- **Unique constraint**: Cannot have duplicate names

### 6. Code Fixes Required
- [x] Fix TagEntity allowedColumns to use camelCase
- [x] Add `withActivatable` mixin to TagService

### 7. Validation
- [x] Run tests: `npm test -- src/products/tags/__tests__`
- [x] Verify 100% pass rate (49 passed, 3 skipped)
- [x] Check all contract tests execute properly
- [x] Verify unique constraint and activation tests work

### 8. Completion
- [x] Tests complete - 49 passed, 3 skipped
- [x] Phase 1 complete (styles, product-types, categories, tags)
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Similar to categories but WITH unique name constraint
- Has timestamps for audit trail
- Unique constraint prevents duplicate tags
- No dependencies on other modules
- Relations defined but read-only (for future use)
- Completes Phase 1 simple lookups (styles, product-types, categories, tags)
