# User Roles Tests

## Objective
Create comprehensive tests for the user-roles submodule following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `codex/user-roles-tests`
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/user-roles/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for UserRoleEntity
- [ ] Write `repository.test.js` - Tests for UserRoleRepository
- [ ] Write `service.test.js` - Tests for UserRoleService

### 3. Test Configuration
**Module Details:**
- **Entity**: UserRoleEntity
- **Repository**: UserRoleRepository (extends BaseRepository)
- **Service**: UserRoleService (extends BaseService only)
- **Custom Methods**: None (pure BaseService)
- **Mixins**: None
- **Fields**: id, label, value, is_active, created_at, updated_at

**Test Data:**
- Use unique generated role names to avoid conflicts
- Pattern: `Test Role N` / `ROLE_TEST_N` where N increments
- No pre-existing roles required for CRUD tests

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods
- `whereForUnique: (data) => ({ value: data.value })` - Unique by value field

### 4. Validation
- [ ] Run tests: `npm test -- src/users/user-roles/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly

### 5. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- UserRoleService has no custom methods beyond BaseService
- This is the simplest submodule - foundation for user-to-roles
- Follow patterns from successful users module tests
- Transaction handling: All tests use transactions and rollback
