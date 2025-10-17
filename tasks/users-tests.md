# Task: Create Unit Tests for Users Module

## Overview

Create comprehensive contract-based tests for the **users** module, following the testing patterns established in `TEST-CONTRACTS.md`.

## Module Analysis

### UserEntity
- **Base**: `createEntityFromModel(DB.users)` + `withRoleAwareEntity` mixin
- **Fields**: 19 fields (id, email, username, display_name, first_name, last_name, password, token_version, provider, reset_password_token, reset_password_expires, is_active, created_at, updated_at, is_deleted, image, is_verified, verified_at, uuid)
- **Hidden Fields**: password, resetPasswordToken, resetPasswordExpires
- **Relations**: 15 relations (account, roles, userToRoles, favorites, carts, orders, credits, invoices, team, contributor, address, families, sets, social, usersToEmail)
- **Custom Methods**:
  - `isAdmin()` - Check if user has ROLE_ADMIN
  - `isContributor()` - Check if user has ROLE_CONTRIBUTOR
  - `isCustomer()` - Check if user has ROLE_CUSTOMER
  - `isDenyAll()` - Check if user has ROLE_DENY_ALL
  - `hasRole(roleValue)` - Check if user has specific role

### UserRepository
- **Base**: `BaseRepository`
- **Custom Methods** (needs investigation):
  - `findByEmail(email)`
  - `findByUsername(username)`
  - `findByUUID(uuid)`
  - `findFullUser(where)` - Load with hidden fields
  - `incrementTokenVersion(uuid)`
  - `updatePassword(uuid, hashedPassword)`
  - `clearResetToken(id)`
  - `findByResetToken(token, now)`

### UserService
- **Base**: `withAccessControllable(withPluggableAndSoftDeletable(BaseService))`
- **Mixins Used**:
  - ✅ `withPluggableAndSoftDeletable` - Supports events + soft delete
  - ✅ `withAccessControllable` - Access control features
- **Custom Methods**:
  - `getOneWithRoles(where)` - Get user with roles relation
  - `getWhereWithRoles(where)` - Get users with roles relation
  - `getByEmail(email)` - Find by email
  - `getByUsername(username)` - Find by username
  - `getByUUID(uuid)` - Find by UUID
  - `getFullUser(where)` - Get user including hidden fields
  - `incrementTokenVersion(uuid)` - Increment token version
  - `updatePassword(uuid, newHashedPassword)` - Update password
  - `clearResetToken(id)` - Clear reset token
  - `getByResetToken(token, now)` - Find by reset token
  - `existsByEmail(email)` - Check email existence
  - `existsByUsername(username)` - Check username existence
  - `softDeleteUser(uuid)` - Soft delete by UUID
  - `assignRole(userId, roleId)` - Assign role to user
  - Named graphs: `default` = `[roles]`, `full` = all relations

## Test Strategy

### Contract Coverage
The service contract will cover:
- ✅ Standard CRUD (create, read, update, delete)
- ✅ Soft delete (mixin)
- ✅ Event emission (pluggable mixin)
- ✅ Basic service methods

### Custom Tests Needed
Because UserEntity, UserRepository, and UserService have **many custom methods**, we need additional test files:

1. **entity.test.js**
   - Contract tests (standard)
   - Custom method tests:
     - `isAdmin()`, `isContributor()`, `isCustomer()`, `isDenyAll()`
     - `hasRole(roleValue)`

2. **repository.test.js**
   - Contract tests (standard)
   - Custom method tests:
     - `findByEmail()`, `findByUsername()`, `findByUUID()`
     - `findFullUser()` (verify hidden fields included)
     - `incrementTokenVersion()`
     - `updatePassword()`, `clearResetToken()`, `findByResetToken()`

3. **service.test.js**
   - Contract tests (standard with mixins enabled)
   - Custom method tests:
     - `getOneWithRoles()`, `getWhereWithRoles()`
     - `getByEmail()`, `getByUsername()`, `getByUUID()`
     - `getFullUser()` (verify hidden fields)
     - `incrementTokenVersion()`
     - `updatePassword()`, `clearResetToken()`, `getByResetToken()`
     - `existsByEmail()`, `existsByUsername()`
     - `softDeleteUser()`
     - `assignRole()` (requires user-roles and user-to-roles)

4. **pluggable.test.js**
   - Event emission tests (create, update, delete, softDelete)

## Test Files to Create

```
src/users/__tests__/
├── entity.test.js         (contract + custom role methods)
├── repository.test.js     (contract + custom finder/auth methods)
├── service.test.js        (contract + custom business logic)
└── pluggable.test.js      (event emission tests)
```

## Dependencies & Constraints

### Required Test Data
- Valid user email (unique)
- Valid username (unique)
- Valid UUID format
- Password hash (bcrypt format)
- At least one user_role record for role tests

### Foreign Key Requirements
Users table is foundational - no required foreign keys.
However, for full testing we need:
- `user_roles` records (for role assignment tests)
- `user_to_roles` junction table (for role association tests)

### Hidden Fields Testing
Must verify that:
- `password`, `resetPasswordToken`, `resetPasswordExpires` are hidden in `toJSON()`
- `findFullUser()` includes hidden fields
- Regular methods exclude hidden fields

## Execution Plan

### Phase 1: Contract-Based Tests
1. Create `entity.test.js` with contract + custom role method tests
2. Create `repository.test.js` with contract + custom method tests
3. Create `service.test.js` with contract (mixins enabled) + custom method tests
4. Create `pluggable.test.js` for event emission

### Phase 2: Run & Iterate
```bash
npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/users/__tests__/*.test.js
```

Repeat until exit code 0.

### Phase 3: Save Results
```bash
mkdir -p tasks-tmp
npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/users/__tests__/*.test.js > tasks-tmp/users-jest.txt 2>&1
```

## Seed Data Patterns

### Entity Test (camelCase)
```javascript
const seedOne = () => ({
    id: 0,
    email: `user-${Math.random().toString(36).slice(2, 8)}@test.com`,
    username: `user_${Math.random().toString(36).slice(2, 8)}`,
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36', // bcrypt hash
    tokenVersion: 1,
    provider: 'email',
    resetPasswordToken: null,
    resetPasswordExpires: null,
    isActive: true,
    isDeleted: false,
    isVerified: false,
    verifiedAt: null,
    image: null,
    uuid: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
});
```

### Repository/Service Test (snake_case)
```javascript
const seedOne = async () => ({
    email: `user-${Math.random().toString(36).slice(2, 8)}@test.com`,
    username: `user_${Math.random().toString(36).slice(2, 8)}`,
    display_name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36',
    token_version: 1,
    provider: 'email',
    is_active: true,
    is_deleted: false,
    is_verified: false,
    uuid: crypto.randomUUID(),
});
```

## Contract Configuration

### Entity Contract
```javascript
entityContract({
    name: 'UserEntity',
    Model: DB.users,
    Entity: UserEntity,
    seedOne,
    updateOne,
    makeRelations,
    hiddenFields: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
});
```

### Repository Contract
```javascript
repositoryContract({
    name: 'User',
    initRepository: () => new UserRepository({ DB }),
    Entity: UserEntity,
    seedOne,
    whereForExisting: (row) => ({ id: row.id }),
    whereForUnique: (data) => ({ email: data.email }),
    supportsRelations: true,
    relationGraph: '[roles]',  // Test with default graph
    modelName: 'users',
});
```

### Service Contract
```javascript
serviceContract({
    name: 'User',
    initService: initUserService,
    Entity: UserEntity,
    seedOne,
    whereForUnique: (data) => ({ email: data.email }),
    supportsSoftDelete: true,   // Uses withPluggableAndSoftDeletable
    supportsActivation: false,  // No activate/deactivate methods
});
```

## Custom Test Examples

### Testing Hidden Fields
```javascript
test('toJSON() excludes hidden fields (password, resetPasswordToken, resetPasswordExpires)', () => {
    const entity = new UserEntity({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        resetPasswordToken: 'token123',
        resetPasswordExpires: new Date(),
    });

    const json = entity.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.resetPasswordToken).toBeUndefined();
    expect(json.resetPasswordExpires).toBeUndefined();
    expect(json.email).toBe('test@example.com');
});
```

### Testing Role Methods
```javascript
test('isAdmin() returns true when user has ROLE_ADMIN', () => {
    const entity = new UserEntity({
        id: 1,
        email: 'admin@test.com',
        roles: [{ value: 'ROLE_ADMIN' }, { value: 'ROLE_CUSTOMER' }]
    });

    expect(entity.isAdmin()).toBe(true);
    expect(entity.isContributor()).toBe(false);
});

test('hasRole() checks for specific role value', () => {
    const entity = new UserEntity({
        id: 1,
        email: 'test@test.com',
        roles: [{ value: 'ROLE_CUSTOM' }]
    });

    expect(entity.hasRole('ROLE_CUSTOM')).toBe(true);
    expect(entity.hasRole('ROLE_ADMIN')).toBe(false);
});
```

### Testing Custom Repository Methods
```javascript
test('findByEmail() finds user by email (case-insensitive)', async () => {
    const user = await repository.create(seedOne(), { trx });

    const found = await repository.findByEmail(user.email.toUpperCase(), {}, { trx });
    expect(found).toBeInstanceOf(UserEntity);
    expect(found.email).toBe(user.email.toLowerCase());
});

test('findFullUser() includes hidden fields', async () => {
    const userData = await seedOne();
    userData.password = 'hashed_password';
    const user = await repository.create(userData, { trx });

    const full = await repository.findFullUser({ id: user.id }, { trx });
    expect(full.password).toBe('hashed_password'); // Should be included
});
```

## Success Criteria

- [ ] All contract tests pass
- [ ] All custom entity method tests pass
- [ ] All custom repository method tests pass
- [ ] All custom service method tests pass
- [ ] All pluggable/event tests pass
- [ ] Hidden fields properly excluded in toJSON()
- [ ] Hidden fields included in findFullUser()
- [ ] Role checking methods work correctly
- [ ] Email/username finder methods work
- [ ] Password and reset token methods work
- [ ] Exit code 0 on final test run
- [ ] Output saved to `tasks-tmp/users-jest.txt`

## Notes

- Users module is **complex** due to many custom methods
- Most other modules will be simpler (contract-only)
- This serves as example for handling custom methods
- Role-related tests may need user_roles seeding
- Password fields should use valid bcrypt hashes for realism
- UUID generation: use `crypto.randomUUID()` or similar

## References

- `TEST-CONTRACTS.md` - Contract testing guide
- `src/accounts/__tests__/*` - Contract example
- `src/credits/__tests__/*` - Pure contract example
- `TEST-STRATEGY.md` - Overall testing philosophy
