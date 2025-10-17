# Test Contracts Guide

## Overview

This guide explains the **contracts-first testing philosophy** used for testing SOA modules in the VectorIcons.net codebase. The contract system provides comprehensive, reusable test factories that eliminate the need for writing repetitive test code.

## Core Philosophy

> **Contracts are comprehensive test factories that cover 90%+ of standard functionality.**

### The Golden Rule

**Only write custom tests when a class has methods NOT in the base class.**

If your Entity/Repository/Service only uses base class methods with no custom additions, the contract tests are sufficient—no custom test code needed.

## The Three Contracts

### 1. Entity Contract (`src/__tests__/contracts/entity.contract.js`)

Tests entity construction, field mapping, serialization, and relation materialization.

**Validates:**
- ✅ Constructor keeps only schema fields (camelCase) and ignores unknowns
- ✅ `toJSON()` returns camelCase data without hidden fields
- ✅ `cloneWith()` creates new instance without mutating original
- ✅ Relation materialization using declared `relatedEntities`
- ✅ Recursive `toJSON()` for nested relations

### 2. Repository Contract (`src/__tests__/contracts/repository.contract.js`)

Tests all standard repository CRUD operations and database interactions.

**Validates:**
- ✅ Model and entity class wiring
- ✅ Public API surface (all expected methods exist)
- ✅ `findAll`, `findById`, `findOne`, `findByIds`
- ✅ `create`, `createMany`, `update`, `updateWhere`
- ✅ `delete`, `deleteWhere`, `exists`, `count`
- ✅ `upsert` (insert and update cases)
- ✅ `paginate` with results, total, page info
- ✅ `withRelations` and `findOneWithRelations`
- ✅ `query()` and `raw()` exposure

### 3. Service Contract (`src/__tests__/contracts/service.contract.js`)

Tests service layer orchestration and business logic.

**Validates:**
- ✅ Repository and entity class wiring
- ✅ `getAll`, `getById`, `getOne`, `getWhere`
- ✅ `create`, `update`, `delete`, `upsert`
- ✅ `exists`, `assertExists` (throws on miss)
- ✅ `paginate` integration
- ✅ Optional: `softDelete` (if `supportsSoftDelete: true`)
- ✅ Optional: `getActive`, `activate`, `deactivate`, `toggleActive` (if `supportsActivation: true`)

## File Structure for a Module

For a module like `src/credits/`:

```
src/credits/
├── CreditEntity.js
├── CreditRepository.js
├── CreditService.js
├── index.js
└── __tests__/
    ├── entity.test.js        ← Entity contract only
    ├── repository.test.js    ← Repository contract only
    ├── service.test.js       ← Service contract only
    └── index.test.js         ← (Optional) Module exports test
```

### When NOT to Create Test Files

❌ **Do NOT create** `pluggable.test.js` if service has NO mixins
❌ **Do NOT create** `observable.test.js` if NOT using observability features
❌ **Do NOT create** `cacheable.test.js` if NOT using caching
❌ **Do NOT create** `soft-delete.test.js` if NOT using soft-delete mixin

**Rule:** Only create test files for features actually implemented in the module.

## Step-by-Step: Creating Tests for a New Module

### Step 0: Create Working Branch

**IMPORTANT:** Always create a new branch before starting work on a module:

```bash
git checkout -b claude/module-name-tests
```

**Branch Naming Convention:**
- Format: `claude/module-name-tests`
- One branch per main module (includes all submodules)
- Examples: `claude/users-tests`, `claude/credits-tests`, `claude/orders-tests`

### Step 1: Verify Schema Consistency

**CRITICAL:** Before writing any tests, verify that the DB model, refs file, and Entity are all in sync.

1. **Get actual DB table schema** (if available):
   ```sql
   -- Use Postico or psql to get DDL
   \d+ table_name
   ```

2. **Check @vectoricons.net/db model** (authoritative source):
   ```bash
   node -p "const DB = require('@vectoricons.net/db'); Object.keys(DB.moduleName.jsonSchema.properties).join(', ')"
   ```

3. **Check refs/db-models file**:
   ```bash
   cat refs/db-models/module-name.js
   ```

4. **Check Entity allowedColumns**:
   ```bash
   cat src/module-name/ModuleEntity.js
   ```

5. **Compare and Document**:
   - Create `tasks/module-name-schema-analysis.md`
   - Document any discrepancies found
   - Update mismatched files before proceeding
   - See `tasks/users-schema-analysis.md` for example

**Common Discrepancies to Watch For:**
- ❌ Field missing from Entity's `allowedColumns`
- ❌ Field in Entity but not in DB model
- ❌ Relation mismatch between refs and Entity
- ❌ Foreign key field name differences (e.g., `transaction_item_id` vs `transaction_id`)

### Step 2: Analyze the Module

1. **Examine the Entity** (`src/module/ModuleEntity.js`):
   - What fields are in `allowedColumns`?
   - What are the `hiddenFields`? (passwords, tokens, etc.)
   - What relations are in `relatedEntities`?
   - Does it have any custom methods? (if yes, need custom tests)
   - Does it use mixins? (e.g., `withRoleAwareEntity`)

2. **Examine the Repository** (`src/module/ModuleRepository.js`):
   - Does it only extend `BaseRepository`?
   - Does it have any custom methods? (if yes, need custom tests)
   - Check for specialized finders (findByEmail, findByUUID, etc.)

3. **Examine the Service** (`src/module/ModuleService.js`):
   - What does it extend? `BaseService` or with mixins?
   - Which mixins? `withSoftDelete`, `withPluggable`, `withAccessControllable`, etc.
   - Does it have any custom methods? (if yes, need custom tests)
   - Does it define custom `graphs` for relation loading?

### Step 3: Determine Required Foreign Keys

Check the DB schema for `NOT NULL` foreign key fields:

```sql
-- Example: credits table requires account_id
account_id integer NOT NULL REFERENCES accounts(id)
```

If foreign keys are required, you'll need to fetch them in `beforeAll()`:

```javascript
let testAccountId;

beforeAll(async () => {
    const { initAccountService } = require('../../accounts');
    const accountService = initAccountService();
    const account = await accountService.getRevenueAccountByUserId(1);
    testAccountId = account.id;
});
```

### Step 4: Write entity.test.js

```javascript
/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const entityContract = require('../../__tests__/contracts/entity.contract');
const ModuleEntity = require('../ModuleEntity');

/**
 * Seed function returns camelCase data matching DB model schema.
 * Used for entity construction (not persistence).
 */
const seedOne = () => ({
    id: 0,
    userId: 1,
    fieldOne: 'value',
    fieldTwo: 100,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
});

/**
 * Returns patch object for testing cloneWith().
 */
const updateOne = (entity) => ({
    fieldOne: `updated-${Math.random().toString(36).slice(2, 8)}`,
    fieldTwo: entity.fieldTwo + 50,
});

/**
 * Returns plain objects for each declared relation.
 * The contract will wrap them in entity instances.
 */
function makeRelations() {
    return {
        user: {
            id: 1,
            email: 'test@example.com',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z')
        },
        // Add other relations as needed
    };
}

entityContract({
    name: 'ModuleEntity',
    Model: DB.moduleName,
    Entity: ModuleEntity,
    seedOne,
    updateOne,
    makeRelations,
    hiddenFields: [],  // Add any hidden fields here (e.g., ['password'])
});
```

**Key Points:**
- Use **camelCase** for all field names (entity layer convention)
- Match **all fields** from `DB.moduleName.jsonSchema.properties`
- Generate unique values where needed (e.g., using `Math.random()`)
- `makeRelations()` should return plain objects, not entity instances

### Step 5: Write repository.test.js

```javascript
/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const ModuleRepository = require('../ModuleRepository');
const ModuleEntity = require('../ModuleEntity');

// If foreign keys are required:
let testForeignKeyId;

beforeAll(async () => {
    // Fetch required foreign key values
    const service = initSomeRelatedService();
    const record = await service.getSomeMethod();
    testForeignKeyId = record.id;
});

/**
 * Seed function returns snake_case data for DB inserts.
 * Always use user_id: 1 (admin test user).
 */
const seedOne = async () => ({
    user_id: 1,
    foreign_key_id: testForeignKeyId,  // If required
    field_one: 'value',
    field_two: 100,
    some_field: `test-${Math.random().toString(36).slice(2, 8)}`,
    is_active: true,
});

const initRepository = () => {
    return new ModuleRepository({ DB });
};

const whereForExisting = (row) => {
    return { id: row.id };
};

repositoryContract({
    name: 'Module',
    initRepository,
    Entity: ModuleEntity,
    seedOne,
    whereForExisting,
    whereForUnique: (data) => ({ user_id: data.user_id, unique_field: data.unique_field }),
    supportsRelations: true,  // Set to false if no relations
    relationGraph: '[user, relatedEntity]',  // Objection.js graph expression
    modelName: 'moduleName',  // Key in DB object
});
```

**Key Points:**
- Use **snake_case** for all field names (database layer convention)
- Always use `user_id: 1` (admin test user in test database)
- `whereForUnique` should target a unique constraint (not just id)
- `relationGraph` must match DB model's `relationMappings` keys

### Step 6: Write service.test.js

```javascript
/* eslint-env jest */

const { initModuleService } = require('../index');
const serviceContract = require('../../__tests__/contracts/service.contract');
const ModuleEntity = require('../ModuleEntity');

// If foreign keys are required:
let testForeignKeyId;

beforeAll(async () => {
    // Fetch required foreign key values (same as repository test)
    const service = initSomeRelatedService();
    const record = await service.getSomeMethod();
    testForeignKeyId = record.id;
});

/**
 * Seed function returns snake_case data (same format as repository).
 */
const seedOne = async () => ({
    user_id: 1,
    foreign_key_id: testForeignKeyId,  // If required
    field_one: 'value',
    field_two: 100,
    some_field: `svc-${Math.random().toString(36).slice(2, 8)}`,
    is_active: true,
});

serviceContract({
    name: 'Module',
    initService: initModuleService,
    Entity: ModuleEntity,
    seedOne,
    whereForUnique: (data) => ({ user_id: data.user_id, unique_field: data.unique_field }),
    supportsSoftDelete: false,  // Set true if service uses withSoftDelete mixin
    supportsActivation: false,  // Set true if service uses withActivatable mixin
});
```

**Key Points:**
- Use same `seedOne` format as repository tests (snake_case)
- Set `supportsSoftDelete: true` only if service uses `withSoftDelete()` mixin
- Set `supportsActivation: true` only if service uses `withActivatable()` mixin
- Contract will skip mixin tests if set to false

## Naming Conventions

### Database Layer (snake_case)
Used in: Repository tests, Service tests, DB migrations

```javascript
{
    user_id: 1,
    account_id: 18,
    transaction_id: null,
    dollar_value_per_credit: 0.01,
    credit_type: 'prepaid',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
}
```

### Entity Layer (camelCase)
Used in: Entity tests, Application code

```javascript
{
    userId: 1,
    accountId: 18,
    transactionId: null,
    dollarValuePerCredit: 0.01,
    creditType: 'prepaid',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z')
}
```

## Common Patterns

### Pattern: Getting Foreign Keys

Many tables require foreign keys. Fetch them in `beforeAll()`:

```javascript
const { initAccountService } = require('../../accounts');

let testAccountId;

beforeAll(async () => {
    const accountService = initAccountService();
    const account = await accountService.getRevenueAccountByUserId(1);
    if (!account) {
        throw new Error('No revenue account found for user_id=1');
    }
    testAccountId = account.id;
});
```

### Pattern: Generating Unique Values

Use random strings for unique constraints:

```javascript
const seedOne = async () => ({
    user_id: 1,
    memo: `test-${Math.random().toString(36).slice(2, 8)}`,  // Random 6-char string
    email: `user-${Math.random().toString(36).slice(2, 8)}@test.com`,
});
```

### Pattern: Conditional Relation Tests

If a module has no relations, set `supportsRelations: false`:

```javascript
repositoryContract({
    // ...
    supportsRelations: false,
    relationGraph: null,  // or omit this property
    // ...
});
```

### Pattern: Optional Fields

For optional fields, either omit them or set to `null`:

```javascript
const seedOne = async () => ({
    user_id: 1,
    required_field: 'value',
    optional_field: null,  // or omit this line entirely
});
```

## Running Tests

### Run All Module Tests
```bash
npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/module-name/__tests__/*.test.js
```

### Run Specific Test File
```bash
npx jest --noStackTrace --runInBand --verbose -- ./src/module-name/__tests__/entity.test.js
```

### Run by Test Type (Project)
```bash
npm run test:entities    # All entity tests
npm run test:repositories # All repository tests
npm run test:services    # All service tests
```

## Troubleshooting

### Error: "must have required property 'field_name'"

**Cause:** Missing required field in `seedOne()`
**Fix:** Check DB model's `required` array and add missing fields

```javascript
// Check required fields:
node -p "const DB = require('@vectoricons.net/db'); DB.moduleName.jsonSchema.required"
```

### Error: "field_name: must be integer" (when passing null)

**Cause:** DB validation doesn't allow null for this field
**Fix:** Either omit the field or provide a valid value

```javascript
// Don't pass null for integer fields:
const seedOne = async () => ({
    user_id: 1,
    // transaction_id: null,  ← Remove this line
});
```

### Error: "unknown relation 'relationName' in eager expression"

**Cause:** Relation doesn't exist in DB model's `relationMappings`
**Fix:** Check actual DB model relations

```javascript
// Check relations:
node -p "const DB = require('@vectoricons.net/db'); Object.keys(DB.moduleName.relationMappings())"
```

### Tests Fail: Entity fields don't match

**Cause:** `allowedColumns` in Entity doesn't match DB model
**Fix:** Update Entity's `allowedColumns` to match DB schema exactly

### Mixin Tests Running When They Shouldn't

**Cause:** Service extends a mixin but contract has `supportsSoftDelete: false`
**Fix:** Set to `true` if mixin is used, or remove mixin from service

## Checklist: Creating Tests for a Module

Use this checklist when creating tests for a new module:

- [ ] **Step 0: Create Working Branch**
  - [ ] Create new branch: `git checkout -b claude/module-name-tests`
  - [ ] Verify on correct branch: `git branch`

- [ ] **Step 1: Verify Schema Consistency**
  - [ ] Get actual DB table DDL (if available)
  - [ ] Check @vectoricons.net/db model schema
  - [ ] Check refs/db-models file
  - [ ] Check Entity `allowedColumns`
  - [ ] Create `tasks/module-name-schema-analysis.md` documenting comparison
  - [ ] Fix any discrepancies before proceeding
  - [ ] Commit schema fixes if any were made

- [ ] **Step 2: Analyze the Module**
  - [ ] List all Entity fields and `hiddenFields`
  - [ ] List all Entity relations in `relatedEntities`
  - [ ] Check for Entity custom methods (if any)
  - [ ] Check for Repository custom methods (if any)
  - [ ] Check Service base class and mixins used
  - [ ] Check for Service custom methods (if any)
  - [ ] Identify required foreign keys from DB schema
  - [ ] Document analysis in `tasks/module-name-tests.md`

- [ ] **Step 3: Determine Test Strategy**
  - [ ] Decide if contract-only tests sufficient
  - [ ] List custom methods that need additional tests
  - [ ] Note which mixin tests needed (pluggable, soft-delete, etc.)

- [ ] **Step 4: Create entity.test.js**
  - [ ] Import `entityContract`, `DB`, and `ModuleEntity`
  - [ ] Write `seedOne()` with all fields (camelCase)
  - [ ] Write `updateOne()` for cloneWith test
  - [ ] Write `makeRelations()` for all relations
  - [ ] Call `entityContract()` with proper config (including hiddenFields)
  - [ ] Add custom tests for Entity custom methods (if any)
  - [ ] Run test: `npx jest ./src/module/__tests__/entity.test.js`

- [ ] **Step 5: Create repository.test.js**
  - [ ] Import contract, repository, entity, and DB
  - [ ] Add `beforeAll()` to fetch foreign keys (if needed)
  - [ ] Write `seedOne()` with all fields (snake_case)
  - [ ] Write `initRepository()`
  - [ ] Call `repositoryContract()` with proper config
  - [ ] Add custom tests for Repository custom methods (if any)
  - [ ] Run test: `npx jest ./src/module/__tests__/repository.test.js`

- [ ] **Step 6: Create service.test.js**
  - [ ] Import contract, service init, and entity
  - [ ] Add `beforeAll()` to fetch foreign keys (if needed)
  - [ ] Write `seedOne()` (snake_case, same as repository)
  - [ ] Call `serviceContract()` with proper config
  - [ ] Set `supportsSoftDelete` and `supportsActivation` correctly
  - [ ] Add custom tests for Service custom methods (if any)
  - [ ] Run test: `npx jest ./src/module/__tests__/service.test.js`

- [ ] **Step 7: Create Additional Test Files (if needed)**
  - [ ] Create `pluggable.test.js` if service uses event mixins
  - [ ] Create other mixin tests as needed
  - [ ] Run individual test files to verify

- [ ] **Step 8: Run All Tests & Iterate**
  - [ ] Run all module tests together
  - [ ] Fix failures iteratively until exit code 0
  - [ ] Save output to `tasks-tmp/module-jest.txt`

- [ ] **Step 9: Cleanup & Document**
  - [ ] Delete any `.bak` test files once confirmed working
  - [ ] Remove any unused test files
  - [ ] Update `TEST-STATUS.md` marking module complete
  - [ ] Commit all test files with descriptive message

## Examples

See `src/accounts/__tests__/*` for working examples of:
- Entity test with relations
- Repository test with relations
- Service test with contracts
- Pluggable test for mixin methods

See `src/credits/__tests__/*` for clean examples of:
- Pure contract-based tests (no custom code)
- Foreign key handling pattern
- Multiple relations tested

## Summary

The contract system dramatically reduces test code by:

1. **Eliminating repetition** - Write config, not tests
2. **Ensuring consistency** - All modules tested the same way
3. **Maintaining coverage** - Contracts test all standard operations
4. **Focusing effort** - Only write tests for custom behavior

Remember: **If the module only uses base classes, the contracts are all you need!**
