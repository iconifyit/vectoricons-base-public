IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for the favorites module

## Goal
Add contract-based tests in `./src/favorites/__tests__/*` using the established contract testing pattern. Ensure full coverage using entity, repository, and service contracts.

## Completed Work

### Test Files Created
- `seed.js` - Seed utilities with seedOne, seedMany, and seedEntity functions
- `entity.test.js` - Entity contract tests using seedEntity
- `repository.test.js` - Repository contract tests using seedOne and seedMany
- `service.test.js` - Service contract tests using seedOne and seedMany

### Seed Pattern
Implemented consolidated seed pattern with three functions in seed.js:
- **seedOne**: Returns DB snake_case data for repository/service tests
- **seedMany**: Returns array of DB snake_case data
- **seedEntity**: Returns camelCase entity data for entity tests

### Test Results
All tests verified passing:
- 3 test suites passed
- 30 tests passed
- 1 test skipped (soft delete not supported)
- Tests activation methods (activate, deactivate, toggleActive)
- Tests relations to user

## Module Details

**Model**: `refs/db-models/favorites.js`
- Fields: id, entity_id, entity_type, user_id, created_at, updated_at, is_active
- Required: entity_id, entity_type
- Relations: user (BelongsToOne)

**Entity**: `src/favorites/FavoriteEntity.js`
- Supports activation methods
- Related entities: user

**Service**: Supports activation, getAll, standard CRUD

## Test Command
```bash
npm run test src/favorites/__tests__/
```

## Notes
- Favorites represent user favorites for any entity type (icons, illustrations, sets, etc.)
- Tests use entity_type='icon' and entity_id as counter for uniqueness
- Follows the new seed pattern established in licenses module
