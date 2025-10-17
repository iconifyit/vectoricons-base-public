# Entity-to-Categories Tests

## Objective
Create comprehensive tests for the entity-to-categories junction table module following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/entity-to-categories-tests`
- [x] Analyze EntityToCategories module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Fix EntityToCategoriesEntity allowedColumns (camelCase)
- [ ] Add custom methods to EntityToCategoriesRepository
- [ ] Create comprehensive tests:
  - [ ] entity.test.js
  - [ ] repository.test.js (contract only)
  - [ ] repository.custom.test.js (custom methods)
  - [ ] service.test.js

### 3. Module Analysis

**Entity Details:**
- **Entity**: EntityToCategoriesEntity
- **Table Type**: Junction table (many-to-many relationship)
- **Fields** (6 total):
  - id (serial primary key)
  - entity_id (integer, NOT NULL - the related entity's ID)
  - entity_type (varchar 32, NOT NULL - entity type like 'icon', 'illustration')
  - category_id (integer, FK to categories)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)
- **Relations** (1 total):
  - categories (CategoryEntity) - belongs to category_id
- **Purpose**: Junction table linking entities (icons, illustrations, etc.) to categories

**Repository:**
- **Repository**: EntityToCategoriesRepository (extends BaseRepository)
- **Model Name**: 'entityToCategories'
- **Custom Methods** (to be added):
  - findByEntity(entityType, entityId) - find categories for an entity
  - findByCategory(categoryId) - find all entities in a category
  - findByEntityType(entityType) - find all mappings for entity type
  - linkEntityToCategory(entityType, entityId, categoryId) - create link
  - unlinkEntityFromCategory(entityType, entityId, categoryId) - remove link
  - getCategoriesForEntity(entityType, entityId) - get category entities

**Service:**
- **Service**: EntityToCategoriesService (extends BaseService)
- **Current Mixins**: None (just BaseService)
- **Dependencies**: None
- **Custom Methods** (to be added): Wrapper methods for repository operations

**Test Data Strategy:**
- Junction table with composite unique constraint (entity_type + entity_id + category_id)
- Test entity_type values: 'icon', 'illustration', 'set', 'family'
- Test linking/unlinking operations
- Test finding by entity, category, and entity type
- Test timestamps (created_at, updated_at)
- Use existing category_id and entity_id from database

**Contract Configuration:**
- `supportsSoftDelete: false` - No is_deleted field
- `supportsActivation: false` - No is_active field
- `supportsTimestamps: true` - Has created_at/updated_at
- `whereForUnique: (data) => ({ entity_id: data.entity_id, entity_type: data.entity_type, category_id: data.category_id })` - Unique by composite key
- `supportsRelations: true` - Test category relation

### 4. Test Coverage

**Entity Tests:**
- Field mapping for 6 fields (camelCase)
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation definition (categories)

**Repository Tests:**
- Standard CRUD operations via contract (repository.test.js)
- Verify correct model wiring (entityToCategories)
- Test timestamp behavior
- Custom method tests (repository.custom.test.js):
  - findByEntity
  - findByCategory
  - findByEntityType
  - linkEntityToCategory
  - unlinkEntityFromCategory

**Service Tests - Contract:**
- Standard service operations via contract
- Timestamp tests

**Service Tests - Custom (Entity-Category Management):**

1. **Link Entity to Category:**
   - Test linking icon to category
   - Test linking illustration to category
   - Test linking set to category
   - Test linking family to category
   - Test duplicate link prevention

2. **Unlink Entity from Category:**
   - Test unlinking entity from category
   - Test unlinking non-existent link

3. **Find by Entity:**
   - Test finding categories for specific entity
   - Test finding with different entity types
   - Test empty result for entity with no categories

4. **Find by Category:**
   - Test finding all entities in a category
   - Test filtering by entity_type within category
   - Test empty result for category with no entities

5. **Find by Entity Type:**
   - Test finding all icon-to-category mappings
   - Test finding all illustration-to-category mappings
   - Test empty result for entity type with no mappings

6. **Bulk Operations:**
   - Test linking entity to multiple categories
   - Test replacing categories for entity
   - Test unlinking entity from all categories

### 5. Validation Rules
- **entity_id**: Integer, required
- **entity_type**: Varchar(32), required (e.g., 'icon', 'illustration', 'set', 'family')
- **category_id**: Integer FK to categories, nullable
- **Composite Unique**: (entity_type, entity_id, category_id) should be unique
- **Timestamps**: Automatically managed

### 6. Code Fixes Required
- [ ] Fix EntityToCategoriesEntity allowedColumns to use camelCase
- [ ] Add custom methods to EntityToCategoriesRepository
- [ ] Add custom methods to EntityToCategoriesService

### 7. Validation
- [ ] Run tests: `npm test -- src/products/entity-to-categories/__tests__`
- [ ] All tests passing
- [ ] All service contract tests pass
- [ ] All custom service tests pass
- [ ] Entity tests: All passing
- [ ] Repository contract tests: All passing
- [ ] Repository custom tests: All passing

### 8. Completion
- [ ] Tests complete - 100% pass rate
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Junction table for many-to-many relationship
- No soft delete or activation fields
- Composite unique constraint on (entity_type, entity_id, category_id)
- entity_type values: 'icon', 'illustration', 'set', 'family' (and potentially others)
- Has 1 relation (categories)
- Use existing category_id values from database for tests
- Test data should use realistic entity_type values
- Timestamps are automatically managed by database triggers
