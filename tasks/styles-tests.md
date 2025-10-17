# Styles Tests

## Objective
Create comprehensive tests for the styles module (product styling lookup) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/products-tests`
- [x] Analyze Style module structure
- [x] Write this task file

### 2. Test Structure
- [x] Create `src/products/styles/__tests__/` directory (if needed)
- [x] Write `entity.test.js` - Tests for StyleEntity
- [x] Write `repository.test.js` - Tests for StyleRepository
- [x] Write `service.test.js` - Tests for StyleService (contract + custom tests)

### 3. Module Analysis

**Entity Details:**
- **Entity**: StyleEntity
- **Fields** (3 total):
  - id (primary key)
  - value (unique, varchar 255)
  - label (varchar 255)
- **Relations**:
  - sets (one-to-many)
  - icons (one-to-many)
  - illustrations (one-to-many)
- **Purpose**: Lookup table for product styles (e.g., "flat", "3d", "line")

**Repository:**
- **Repository**: StyleRepository (extends BaseRepository)
- **Model Name**: 'styles'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: StyleService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Test Data Strategy:**
- Simple lookup table with value/label pairs
- No soft delete, no timestamps, minimal fields
- Unique constraint on value field
- Test duplicate value constraint

**Contract Configuration:**
- `supportsSoftDelete: false` - No is_deleted field
- `supportsActivation: false` - No is_active field
- `supportsTimestamps: false` - No created_at/updated_at
- `whereForUnique: (data) => ({ value: data.value })` - Unique by value
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping for 3 fields (id, value, label)
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation definitions (sets, icons, illustrations)

**Repository Tests:**
- Standard CRUD operations via contract
- Test unique constraint on value field
- Verify correct model wiring (styles)

**Service Tests - Contract:**
- Standard service operations via contract
- No soft delete tests
- No activation tests
- No timestamp tests

**Service Tests - Custom (Lookup Operations):**

1. **Unique Value Constraint:**
   - Test creating styles with same value fails
   - Test updating to duplicate value fails

2. **Lookup Operations:**
   - Test finding style by value
   - Test finding style by label
   - Test case sensitivity on value field

3. **Bulk Operations:**
   - Test creating multiple styles
   - Test finding all styles
   - Test filtering styles

### 5. Validation Rules
- **Value**: Required, unique, max 255 chars
- **Label**: Required, max 255 chars
- **No soft delete**: Records are permanent or hard deleted
- **No activation**: All styles are always "active"

### 6. Validation
- [x] Run tests: `npm test -- src/products/styles/__tests__`
- [x] Verify 100% pass rate (37 passed, 4 skipped)
- [x] Check all contract tests execute properly

### 7. Completion
- [x] Tests complete - 37 passed, 4 skipped
- [ ] Commit changes with proper message
- [ ] Continue to next module (product-types)

## Notes
- Simplest lookup table - no soft delete, activation, or timestamps
- Value field is unique - use for lookups
- No dependencies on other modules
- Relations are defined but read-only (for future use)
- Focus on unique constraint validation
