# Categories Tests

## Objective
Create comprehensive tests for the categories module (product category lookup with activation and timestamps) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/categories-tests`
- [x] Analyze Category module structure
- [x] Write this task file

### 2. Test Structure
- [x] Fix CategoryEntity allowedColumns (camelCase)
- [x] Fix CategoryService (add withActivatable mixin)
- [x] Create comprehensive tests:
  - [x] entity.test.js
  - [x] repository.test.js
  - [x] service.test.js

### 3. Module Analysis

**Entity Details:**
- **Entity**: CategoryEntity
- **Fields** (5 total):
  - id (primary key)
  - name (varchar 255)
  - is_active (boolean, default true)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)
- **Relations**:
  - entityToCategories (one-to-many)
- **Purpose**: Lookup table for product categories with activation and timestamps

**Repository:**
- **Repository**: CategoryRepository (extends BaseRepository)
- **Model Name**: 'categories'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: CategoryService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)
- **Required Fix**: Add `withActivatable` mixin for is_active support

**Test Data Strategy:**
- Simple lookup table with name and activation
- Has timestamps (created_at, updated_at)
- No soft delete, no unique constraints
- Test activation/deactivation
- Test timestamp tracking

**Contract Configuration:**
- `supportsSoftDelete: false` - No is_deleted field
- `supportsActivation: true` - Has is_active field
- `supportsTimestamps: true` - Has created_at/updated_at
- `whereForUnique: (data) => ({ name: data.name })` - Use name for uniqueness in tests
- `supportsRelations: false` - Skip relation testing

### 4. Test Coverage

**Entity Tests:**
- Field mapping for 5 fields (camelCase)
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation definitions (entityToCategories)

**Repository Tests:**
- Standard CRUD operations via contract
- Verify correct model wiring (categories)
- Test timestamp behavior

**Service Tests - Contract:**
- Standard service operations via contract
- No soft delete tests
- Activation/deactivation tests
- Timestamp tests

**Service Tests - Custom (Category Management):**

1. **Activation Management:**
   - Test activate()/deactivate() methods
   - Test toggleActive() method
   - Test getActive() returns only active records
   - Test filtering by is_active

2. **Category Operations:**
   - Test creating categories with different names
   - Test finding by name
   - Test finding by id
   - Test listing all categories
   - Test filtering active vs inactive

3. **Bulk Operations:**
   - Test creating multiple categories
   - Test bulk activation/deactivation
   - Test filtering operations

4. **Timestamp Tracking:**
   - Test created_at is set on creation
   - Test updated_at is set on creation
   - Test updated_at changes on update

### 5. Validation Rules
- **Name**: Optional, max 255 chars
- **is_active**: Boolean, defaults to true
- **Timestamps**: Automatically managed
- **No soft delete**: Records are permanent or hard deleted
- **No unique constraints**: Can have duplicate names

### 6. Code Fixes Required
- [x] Fix CategoryEntity allowedColumns to use camelCase
- [x] Add `withActivatable` mixin to CategoryService

### 7. Validation
- [x] Run tests: `npm test -- src/products/categories/__tests__`
- [x] Verify 100% pass rate (45 passed, 3 skipped)
- [x] Check all contract tests execute properly
- [x] Verify activation and timestamp tests work

### 8. Completion
- [x] Tests complete - 45 passed, 3 skipped
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch
- [ ] Continue to next module (tags)

## Notes
- Simple lookup table with activation and timestamps
- No unique constraints (unlike styles/product-types)
- Has timestamps for audit trail
- No dependencies on other modules
- Relations defined but read-only (for future use)
- First module with full timestamp support
