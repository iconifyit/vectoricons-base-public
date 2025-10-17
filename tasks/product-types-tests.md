# Product Types Tests

## Objective
Create comprehensive tests for the product-types module (product type lookup with activation) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Using existing branch `claude/products-tests`
- [x] Analyze ProductType module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/products/product-types/__tests__/` directory (if needed)
- [ ] Write `entity.test.js` - Tests for ProductTypeEntity
- [ ] Write `repository.test.js` - Tests for ProductTypeRepository
- [ ] Write `service.test.js` - Tests for ProductTypeService (contract + custom tests)

### 3. Module Analysis

**Entity Details:**
- **Entity**: ProductTypeEntity
- **Fields** (4 total):
  - id (primary key)
  - value (unique, varchar 255, required)
  - label (varchar 255, required)
  - is_active (boolean, default true)
- **Relations**:
  - sets (one-to-many)
- **Purpose**: Lookup table for product types (e.g., "icon", "illustration") with activation

**Repository:**
- **Repository**: ProductTypeRepository (extends BaseRepository)
- **Model Name**: 'productTypes'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: ProductTypeService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)
- **Required Fix**: Add `withActivatable` mixin for is_active support

**Test Data Strategy:**
- Lookup table with value/label pairs and activation
- No soft delete, no timestamps
- Unique constraint on value field
- Test duplicate value constraint
- Test activation/deactivation

**Contract Configuration:**
- `supportsSoftDelete: false` - No is_deleted field
- `supportsActivation: true` - Has is_active field
- `supportsTimestamps: false` - No created_at/updated_at
- `whereForUnique: (data) => ({ value: data.value })` - Unique by value
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping for 4 fields (id, value, label, is_active/isActive)
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation definitions (sets)

**Repository Tests:**
- Standard CRUD operations via contract
- Test unique constraint on value field
- Verify correct model wiring (productTypes)

**Service Tests - Contract:**
- Standard service operations via contract
- No soft delete tests
- Activation/deactivation tests
- No timestamp tests

**Service Tests - Custom (Lookup + Activation):**

1. **Unique Value Constraint:**
   - Test creating product types with same value fails
   - Test updating to duplicate value fails

2. **Activation Management:**
   - Test activate()/deactivate() methods
   - Test toggleActive() method
   - Test getActive() returns only active records

3. **Lookup Operations:**
   - Test finding product type by value
   - Test finding by label
   - Test filtering by is_active

4. **Bulk Operations:**
   - Test creating multiple product types
   - Test filtering active vs inactive

### 5. Validation Rules
- **Value**: Required, unique, max 255 chars
- **Label**: Required, max 255 chars
- **is_active**: Boolean, defaults to true
- **No soft delete**: Records are permanent or hard deleted
- **No timestamps**: No created_at/updated_at tracking

### 6. Code Fixes Required
- [ ] Add `withActivatable` mixin to ProductTypeService
- [ ] Fix ProductTypeEntity line 17: change `sets:` to `relatedEntities: { sets: }`

### 7. Validation
- [ ] Run tests: `npm test -- src/products/product-types/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly
- [ ] Verify activation tests work

### 8. Completion
- [ ] Commit changes with proper message
- [ ] Continue to next module (categories)

## Notes
- Simple lookup table with activation support
- Value field is unique - use for lookups
- No dependencies on other modules
- Similar to styles but with is_active field
- Relations defined but read-only (for future use)
