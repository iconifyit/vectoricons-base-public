# ADR-004: Contract-Based Testing

## Status
Accepted

## Context

78 modules follow the same Entity-Repository-Service pattern with consistent behavior:
- All entities serialize via `toJSON()`
- All repositories support CRUD operations
- All services wrap entities and handle transactions
- Some modules support optional capabilities (soft delete, activation, caching)

**Testing Challenges:**
- Repetitive test code across modules
- Inconsistent test coverage (some modules well-tested, others minimal)
- No guarantee that new modules meet base contracts
- Changes to base classes not consistently reflected in tests
- Difficult to ensure all modules handle edge cases

**Example of Repetitive Tests:**

Every module needs similar tests:
```javascript
// accounts/__tests__/entity.test.js
test('toJSON returns plain object', () => { ... });
test('hides sensitive fields', () => { ... });

// users/__tests__/entity.test.js
test('toJSON returns plain object', () => { ... });  // Duplicate
test('hides sensitive fields', () => { ... });       // Duplicate

// ... repeated 78 times
```

This violates DRY principle and creates maintenance burden.

## Decision

Implement reusable test contracts that validate standard behavior.

### Contract Structure

Three test contracts corresponding to SOA layers:

1. **Entity Contract** (`src/__tests__/contracts/entity.contract.js`)
   - Validates entity instantiation
   - Tests `toJSON()` serialization
   - Verifies hidden fields filtered
   - Checks relation materialization

2. **Repository Contract** (`src/__tests__/contracts/repository.contract.js`)
   - Validates CRUD operations
   - Tests pagination (offset-based)
   - Verifies entity wrapping
   - Checks transaction support

3. **Service Contract** (`src/__tests__/contracts/service.contract.js`)
   - Validates service initialization
   - Tests CRUD via service methods
   - Checks optional capabilities (soft delete, activation)
   - Verifies transaction propagation

### Usage

Module tests invoke contracts with module-specific configuration:

```javascript
// src/accounts/__tests__/service.test.js
const { initAccountService } = require('../index');
const serviceContract = require('../../__tests__/contracts/service.contract');
const AccountEntity = require('../AccountEntity');

const seedOne = () => ({
  user_id: 1,
  account_type_id: 2,
  label: `account-${Math.random().toString(36).slice(2, 8)}`,
  balance: 0
});

serviceContract({
  name: 'Account',
  initService: initAccountService,
  Entity: AccountEntity,
  seedOne: seedOne,
  supportsSoftDelete: false,
  supportsActivation: false,
  whereForUnique: (data) => ({ user_id: data.user_id, label: data.label })
});
```

This generates ~30 tests automatically.

### Capability Detection

Contracts detect capabilities at runtime:

```javascript
const service = initService();
const supports = {
  softDelete: typeof service.softDelete === 'function',
  activate: typeof service.activate === 'function',
  cache: typeof service.clearCache === 'function'
};

if (supports.softDelete) {
  test('soft delete marks record deleted', async () => { ... });
} else {
  test.skip('soft delete not supported');
}
```

This ensures tests only run for implemented capabilities, avoiding false failures.

### Custom Tests

Contracts cover common behavior. Module-specific tests added separately:

```javascript
// After contract tests
describe('Account-specific tests', () => {
  test('calculates balance correctly', async () => { ... });
  test('validates account type exists', async () => { ... });
});
```

## Consequences

### Positive

**Reduced Code Duplication:**
- 200+ lines of tests reduced to ~40 lines per module
- Common behavior tested once in contract
- Updates to contract propagate to all modules

**Consistency:**
- All modules guaranteed to meet base contracts
- New modules follow same testing patterns
- Edge cases handled uniformly

**Maintainability:**
- Contract changes update all module tests
- Easy to add new common behaviors
- Clear separation: contract tests vs. custom tests

**Quality Assurance:**
- Guaranteed baseline test coverage
- No modules skip essential tests
- Capability detection prevents invalid tests

**AI-Assisted Development:**
- Clear pattern for testing new modules
- AI can generate module tests using contract template
- Focused on module-specific logic, not boilerplate

**Documentation:**
- Contracts document expected behavior
- New developers see what modules must support
- Self-documenting via test names

### Negative

**Contract Changes Affect All Modules:**
- Breaking change in contract breaks all module tests
- Must ensure contract changes are valid for all modules
- Requires careful consideration before modifying

**Custom Behavior Requires Custom Tests:**
- Contracts don't cover module-specific logic
- Still need to write tests for unique features
- Can't rely on contracts alone

**Runtime Capability Detection:**
- Can't statically analyze which tests will run
- Must run tests to see which capabilities supported
- TypeScript wouldn't help (runtime detection needed)

**Abstraction Overhead:**
- Must understand contract implementation
- Debugging failures may require reading contract code
- Learning curve for new developers

## Alternatives Considered

### Copy-Paste Test Suites
**Approach:** Copy test file from one module to another, modify as needed.

**Rejected Because:**
- Updates don't propagate (each module has copy)
- Inconsistent coverage (easy to skip tests)
- Maintenance nightmare (change in 78 places)
- Easy to forget edge cases

### Abstract Base Test Classes
**Approach:** Create `EntityTestBase` class, extend per module.

**Rejected Because:**
- Jest doesn't support class-based tests well
- Harder to pass module-specific configuration
- Inheritance issues with test lifecycle (beforeEach, afterEach)
- Less flexible than functional approach

### Test Generators
**Approach:** Write script that generates test files from templates.

**Rejected Because:**
- Generated files clutter repository
- Harder to customize generated tests
- Still have maintenance burden (regenerate when template changes)
- Contract functions achieve same result without generation step

## Implementation Notes

### Contract Locations
```
src/__tests__/contracts/
  ├── entity.contract.js        # Entity layer tests
  ├── repository.contract.js    # Repository layer tests
  └── service.contract.js       # Service layer tests
```

### Required Module Configuration

**Entity Contract:**
```javascript
{
  name: 'Account',              // Module name
  Entity: AccountEntity,        // Entity class
  model: DB.accounts,           // Objection.js model
  seedOne: () => ({ ... }),     // Factory function
  requiredFields: ['user_id'],  // Fields that can't be null
  relatedEntities: []           // Expected relations
}
```

**Repository Contract:**
```javascript
{
  name: 'Account',
  Repository: AccountRepository,
  Entity: AccountEntity,
  seedOne: () => ({ ... }),
  whereForUnique: (data) => ({ user_id: data.user_id })
}
```

**Service Contract:**
```javascript
{
  name: 'Account',
  initService: initAccountService,
  Entity: AccountEntity,
  seedOne: () => ({ ... }),
  supportsSoftDelete: false,
  supportsActivation: false,
  whereForUnique: (data) => ({ user_id: data.user_id })
}
```

### Seed Functions

Seed functions generate unique test data:

```javascript
const seedOne = () => ({
  user_id: 1,
  label: `account-${Math.random().toString(36).slice(2, 8)}`,  // Unique
  balance: 0
});
```

Randomized fields prevent test conflicts from parallel execution.

### Integration with Real Database

Contracts use real PostgreSQL database (not mocks):

```javascript
const DB = require('@vectoricons.net/db');

beforeAll(async () => {
  await DB.knex.raw('BEGIN');  // Start transaction
});

afterAll(async () => {
  await DB.knex.raw('ROLLBACK');  // Rollback all changes
});
```

This ensures tests validate actual database behavior, including:
- Foreign key constraints
- Unique constraints
- Database triggers
- Query performance

## Related Decisions

- [ADR-001: Service-Oriented Architecture](./ADR-001-service-oriented-architecture.md) - Defines layers tested by contracts
- [ADR-002: Mixin Pattern](./ADR-002-mixin-pattern.md) - Capability detection tests mixins
- [Test Strategy](../design/TEST-STRATEGY.md) - Integration testing approach

## References

- Contract implementations: `src/__tests__/contracts/`
- Example usage: `src/accounts/__tests__/service.test.js`
- Test strategy: `docs/design/TEST-STRATEGY.md`
- Test contracts guide: `docs/design/TEST-CONTRACTS.md`

---

**Date:** 2025-10-17
**Author:** Scott Lewis
