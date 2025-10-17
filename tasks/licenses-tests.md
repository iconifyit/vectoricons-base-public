IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create contract-based tests for the licenses module

## Goal
Add contract-based tests in `./src/licenses/__tests__/*` using the established contract testing pattern. Ensure full coverage using entity, repository, and service contracts.

## Completed Work

### Test Files Created
- `seed.js` - Seed utilities with seedOne, seedMany, and seedEntity functions
- `entity.test.js` - Entity contract tests using seedEntity
- `repository.test.js` - Repository contract tests using seedOne and seedMany
- `service.test.js` - Service contract tests using seedOne and seedMany

### New Seed Pattern
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
- Tests relations to families, sets, icons, illustrations

## Module Details

**Model**: `refs/db-models/licenses.js`
- Fields: id, name, text, is_active, is_default, type, created_at, updated_at
- Required: name
- Relations: families (HasMany), sets (HasMany), icons (HasMany), illustrations (HasMany)

**Entity**: `src/licenses/LicenseEntity.js`
- Supports activation methods
- Related entities: families, sets, icons, illustrations

**Service**: Supports activation, getAll, standard CRUD

## Test Command
```bash
npm run test src/licenses/__tests__/
```

## Pattern Established
This module established the new seed pattern that should be used for all future modules:
- All seed functions (seedOne, seedMany, seedEntity) live in seed.js
- Entity tests import and use seedEntity directly
- Repository/Service tests import and use seedOne/seedMany
- No duplication of seed logic across files
