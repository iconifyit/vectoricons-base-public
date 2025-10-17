# User-to-Roles Tests

## Objective
Create comprehensive tests for the user-to-roles submodule (bridge table between users and roles) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/user-to-roles-tests`
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/user-to-roles/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for UserToRolesEntity
- [ ] Write `repository.test.js` - Tests for UserToRolesRepository
- [ ] Write `service.test.js` - Tests for UserToRolesService (contract + custom methods)

### 3. Module Analysis

**Entity Details:**
- **Entity**: UserToRolesEntity
- **Fields**: id, user_id, user_role_id, created_at, updated_at
- **Relations**: user (UserEntity), userRole (UserRoleEntity)

**Repository:**
- **Repository**: UserToRolesRepository (extends BaseRepository)
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: UserToRolesService (extends BaseService)
- **Dependencies**: UserService, UserRoleService
- **Custom Methods**:
  1. `getRolesForUser(userId, { trx })` - Get all roles assigned to a user
  2. `getUserRolesMapByUUID(uuid, { trx })` - Get role map by user UUID
  3. `getUserRolesMapById(userId, { trx })` - Get role map by user ID
  4. `addRoleToUser(userId, roleId, { trx })` - Assign role to user (idempotent)
  5. `removeRoleFromUser(userId, roleId, { trx })` - Remove role from user
  6. `_buildMap(roles, { trx })` - Helper to build role label map

**Test Data Strategy:**
- Bridge table requires creating test users and test roles first
- Use unique generated data to avoid conflicts
- Pattern: Create user → Create role → Create user-to-role assignment
- Test unique constraint: (user_id, user_role_id) should be unique

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods
- `whereForUnique: (data) => ({ user_id: data.user_id, user_role_id: data.user_role_id })`
- `supportsRelations: true` - Has user and userRole relations
- `relationGraph: '[user, userRole]'` - For testing relation loading

### 4. Custom Method Test Coverage

#### getRolesForUser()
- Returns array of UserRoleEntity objects for a given user
- Returns empty array when user has no roles
- Filters correctly by user_id

#### getUserRolesMapByUUID()
- Returns role map object with label/value keys
- Throws error when user UUID not found
- Uses UserService.getByUUID internally

#### getUserRolesMapById()
- Returns role map object for user by ID
- Returns empty map when user has no roles

#### addRoleToUser()
- Creates new user-role assignment
- Returns existing assignment if already exists (idempotent)
- Properly handles transaction context

#### removeRoleFromUser()
- Removes user-role assignment
- Returns null if assignment doesn't exist
- Properly deletes from database

#### _buildMap() [private helper]
- Builds map with both label and value keys
- Handles empty role arrays
- Maps correctly to role IDs

### 5. Validation
- [ ] Run tests: `npm test -- src/users/user-to-roles/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly
- [ ] Verify custom method tests cover all scenarios

### 6. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- This is a bridge/junction table pattern - many-to-many relationship
- Requires seeding both users and roles before testing assignments
- Custom methods have cross-service dependencies (UserService, UserRoleService)
- Some methods use internal helpers that need indirect testing
- Transaction handling critical for data integrity in bridge tables
