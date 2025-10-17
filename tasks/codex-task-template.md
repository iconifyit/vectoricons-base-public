# 🛠️ Codex Task: Implement `${ModuleName}` Module

NOTE: Refer to ./AGENTS.md for overall architecture, implementation patterns, and coding guidelines.

## 🧩 Overview

Implement the `${ModuleName}Entity`, `${ModuleName}Repository`, and `${ModuleName}Service` classes for the `${ModuleName}` module in the `Base` repo. This module follows the SOA (Service-Oriented Architecture) pattern used throughout the project.

**Target Directory**: `src/${modulename}`

## 📄 Files to Work On

- `${ModuleName}Entity.js` — define the entity class using private fields and standard getters/setters
- `${ModuleName}Repository.js` — extend `BaseRepository`, implement DB interaction logic
- `${ModuleName}Service.js` — orchestrate business logic, using the repository

Reference the existing accounts, carts, and cashout-requests modules for examples of how to structure these classes.

## 🧠 Reference Models

Use Objection.js model definition as a reference for the ${ModuleName} module:

```
refs/db-models/${modulename}.js
```

This defines table columns, relations, and validation logic using Objection.js. Only use fields explicitly defined in the model.

Refer to src/accounts/ as an example of proper implementation of the Entity, Repository, and Service classes. Ignore src/accounts/account-types/* in this case since ${modulename} does not have a similar submodule.


## ${ModuleName} Table Schema

-- Table Definition ----------------------------------------------


-- ---------------------------------------------------------------

## Entity Class Implementation

Mirror src/accounts/AccountEntity.js for the ${ModuleName} entity.

```js
// Path: src/${modulename}/${ModuleName}Entity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a ${modulename} item in the system.
 * Extends BaseEntity to include common entity functionality.
 * Uses withTimestamp trait to automatically manage created_at and updated_at fields.
 * @see {@link ../../../refs/db-models/${modulename}.js} Objection.js model for ${modulename}
 */
class ${ModuleName}Entity extends createEntityFromModel(DB.${modulename}) {}

module.exports = ${ModuleName}Entity;
```

## Repository Class Implementation
```js
// Path: src/${modulename}/${ModuleName}Repository.js
const { BaseRepository } = require('../common/BaseRepository');
const DB = require('@vectoricons.net/db');

class ${ModuleName}Repository extends BaseRepository {
    super({
        DB,
        modelName: '${modulename}',
        entityClass: ${ModuleName}Entity
    });

    // Implement any custom DB interaction methods here
}

module.exports = ${ModuleName}Repository;
```

## Service Class Implementation

```js
// Path: src/${modulename}/${ModuleName}Service.js
const { BaseService }     = require('../common/BaseService');
const ${ModuleName}Repository  = require('./${ModuleName}Repository');
const ${ModuleName}Entity      = require('./${ModuleName}Entity');

class ${ModuleName}Service extends BaseService {
    constructor({ repository, entityClass }) {
        super({
            repository  : repository,
            entityClass : entityClass || ${ModuleName}Entity,
        });
    }
}

module.exports = ${ModuleName}Service;
```

Add any additional methods to the service class as needed based on the refs/db-models/${modulename}.js Objection.js model, following the patterns established in the accounts module and in AGENTS.md.

Add unit tests for the service methods in `src/${modulename}/__tests__/${ModuleName}Service.test.js` to ensure they work as expected.

## DOs

- Refer to src/accounts/AccountEntity.js, src/accounts/AccountRepository.js, and src/accounts/AccountService.js for examples of proper implementation.
- Use `refs/db-models/${modulename}.js` as the schema reference for the ${ModuleName} module.
- Follow the established folder structure and naming conventions.
- Write unit tests for all new functionality.
- Write unit tests for the Entity, Service, and Repository classes.
- Document any new public methods or classes.
- If any existing code is in conflict with these instructions, over-write the existing code with the new implementation.
- When referring to a user in tests, do not create an arbitrary user. Select the user with ID = 1 from the DB with `const user = await DB.users.query().findById(1);`. This user is guaranteed to exist in the live DB and is used as a reference for testing purposes. If you need more than one user, select the user with ID = 2, and so on. Do not create new users in the tests, as this will cause conflicts with the live DB.
- When tests call for a family, set, icon, or illustration, select a list of IDs from the live DB and retrieve those items. DO not insert new items into the DB because there may be relationships and dependencies on other items that will not be present. Be sure to respect the relationships between icons|illustrations, sets, and families. Refer to AGENTS.md for full details on the data structure and relationsips between icons, illustrations, sets, and families.

## ❌ Don’ts

- Do **not** use `import`/`export` syntax. Use `require()` and `module.exports`.
- Do **not** add unrelated logic or extra helpers.
- Do **not** include REST routes, validators, or controller code — this module only implements the core logic.
- Do **not** Use the existing code as a reference for the ${ModuleName} module. The instructions above provide the correct implementation patterns to follow. The existing code should be considered deprecated and obsolete.
- DO use the  live DB connection for testing purposes. The `DB` object is already set up to connect to the live database, so you can use it directly in your repository and service classes. You do not need to create mocks for the ${ModuleName}Repository.test.js, ${ModuleName}Service.test.js, or ${ModuleName}Entity.test.js files. The live DB connection will be used for testing the ${ModuleName} module.

## Example Test with Live DB
The example below is from the AccountRepository.test.js file, which uses the live DB connection to test the AccountRepository methods. You can follow a similar pattern for your ${ModuleName} module tests.

```js
// Path: src/accounts/__tests__/AccountRepository.test.js

const AccountRepository = require('../AccountRepository');
const AccountEntity = require('../AccountEntity');
const DB = require('@vectoricons.net/db');
const uuid = require('uuid').v7;

const getTestItems = (count = 1) => {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push({
            user_id         : i + 1,
            account_type_id : 2,
            label           : `Test Account ${i + 1}`,
            description     :  `Description for account ${i + 1}`,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        });
    }
    return (items || []).length === 1 ? items.pop() : items;
};


describe('AccountRepository', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        trx = await DB.knex.transaction();
        repository = new AccountRepository({ DB });
    });

    afterAll(async () => {
        try {
            await trx.rollback();
            await DB.destroyInstance();
        }
        catch (error) { /* Exist gracefully */ }
    });

    it('should instantiate with model and entityClass', () => {
        expect(repository.model).toBeDefined();
        expect(repository.entityClass).toBe(AccountEntity);
    });

    it('should wrap result with AccountEntity in findById()', async () => {
        const row = await DB.accounts.query().first();
        expect(row).toBeDefined();

        const result = await repository.findById(row.id);
        expect(result).toBeInstanceOf(AccountEntity);
        expect(result.id).toBe(row.id);
    });

    it('should support findByUserId()', async () => {
        const row = await DB.accounts.query().first();
        expect(row).toBeDefined();

        const results = await repository.findByUserId(row.user_id);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toBeInstanceOf(AccountEntity);
        expect(results[0].user_id).toBe(row.user_id);
    });

    it('should create a new account', async () => {
        const data = {
            user_id         : 1,
            account_type_id : 2,
            label           : 'Test Account',
            description     : 'Test Description',
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        };

        const created = await repository.create(data, { trx });
        expect(created.constructor.name).toBe('AccountEntity');
        expect(created.label).toBe('Test Account');
    });

    it('should update an account', async () => {
        const created = await repository.create(getTestItems(1), { trx });

        console.log('Created account:', created);

        const updated = await repository.update(created.id, { label: 'Updated' }, { trx });

        console.log('Updated account:', updated);

        const found = await repository.findById(created.id, { trx });

        console.log('Found account:', found);
        
        expect(found.label).toBe('Updated');
    });

    it('should delete an account', async () => {
        const created = await repository.create(getTestItems(1), { trx });

        console.log('Created account:', created);

        const deletedCount = await repository.delete(created.id, { trx });

        console.log('Deleted count:', deletedCount);

        expect(deletedCount).toBe(1);
    });

    it('should paginate results', async () => {
        await repository.createMany(getTestItems(3), { trx });

        const { results, total, page } = await repository.paginate({}, 1, 2);
        expect(Array.isArray(results)).toBe(true);
        expect(page).toBe(1);
        expect(total).toBeGreaterThan(0);
    });

    it('should count and check existence', async () => {
        const uniqueId = uuid();
        const initial = await repository.count();
        const created = await repository.create({
            user_id         : 1,
            account_type_id : 2,
            label           : uniqueId,
            description     :  `Description for account ${uniqueId}`,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        }, { trx });
        const count  = await repository.count({}, { trx });
        const exists = await repository.exists({ id: created.id }, { trx });

        console.log('Initial count:', initial);
        console.log('Count after creation:', count);

        expect(count).toBeGreaterThanOrEqual(initial + 1);
        expect(exists).toBe(true);
    });

    it('should find one account by label using findOne', async () => {
        const uniqueId = uuid();
        const kTEST_ID = 1;
        const kTEST_DESCRIPTION = `Description for account ${uniqueId}`;
        const created = await repository.create({
            user_id         : kTEST_ID,
            account_type_id : 2,
            label           : uniqueId,
            description     : kTEST_DESCRIPTION,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        }, { trx });

        const result = await repository.findOne({ label: uniqueId }, { trx });
        expect(result).toBeInstanceOf(AccountEntity);
        expect(result.id).toBe(created.id);
        expect(result.description).toBe(created.description);
    });

    it('should find multiple accounts by user_id using findAll', async () => {
        const results = await repository.findAll({ user_id: 1 }, { trx });
        
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        results.forEach(result => {
            expect(result).toBeInstanceOf(AccountEntity);
            expect(result.user_id).toBe(1);
        });
    });

    it('should find accounts by IDs using findByIds', async () => {
        const rows    = await DB.accounts.query().limit(2);
        const ids     = rows.map(r => r.id);
        const results = await repository.findByIds(ids);
        
        expect(results.length).toBe(ids.length);
        results.forEach(result => expect(result).toBeInstanceOf(AccountEntity));
    });

    it('should update multiple records with updateWhere', async () => {
        const labelOne = 'Original Label';
        const updatedLabel = 'Updated Label';
        const created = await repository.create({
            user_id         : 1,
            account_type_id : 2,
            label           : labelOne,
            description     : `Description for account`,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        }, { trx });

        expect(await repository.updateWhere(
            { id: created.id }, 
            {label: 'Update me'},
            {trx}
        )).toEqual(1);
    });

    it('should delete multiple records with deleteWhere', async () => {
        const created = await repository.create({
            user_id         : 1,
            account_type_id : 2,
            label           : 'DeleteWhere Test',
            description     : `Description for account`,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        }, { trx });

        const deleted = await repository.deleteWhere({ id: created.id }, { trx });
        expect(deleted).toEqual(1);
    });

    it('should insert and update with upsert', async () => {
        const uniqueIdOne = uuid();
        const created = await repository.create({
            user_id         : 1,
            account_type_id : 2,
            label           : 'Upsert Test',
            description     : `Description for account ${uniqueIdOne}`,
            status          : 'active',
            balance         : 100,
            created_at      : new Date().toISOString(),
            updated_at      : new Date().toISOString(),
        }, { trx });

        expect(created).toBeInstanceOf(AccountEntity);
        expect(created.label).toBe('Upsert Test');

        const updated = await repository.upsert({
            id    : created.id,
            label : 'Updated Upsert Label',
        }, {id : created.id}, { trx });

        console.log('Created account:', created);
        console.log('Upserted account:', updated);

        expect(updated.label).toBe('Updated Upsert Label');
    });

    it('should return raw SQL result', async () => {
        const result = await repository.raw('SELECT 1 + 1 AS two');
        expect(result?.rows?.[0]?.two).toBe(2);
    });

    it('should return a query builder instance from query()', async () => {
        const result = await repository.query().first();
        expect(result).toHaveProperty('id');
    });

    it('should fetch an account with related accountType and user', async () => {
        // Insert related records
        const user = await DB.users.query(trx).findById(1);

        console.log('User:', user);

        if (! user) {
            throw new Error('User with ID 1 not found');
        }

        // Fetch with relations
        const result = (await repository.withRelations(
            { user_id: user.id, account_type_id: 2},
            '[accountType, users]',
            { trx }
        ) || []).shift();

        console.log('Account:', result);

        const accountType = await DB.accountTypes.query(trx).findById(
            result?.accountType?.id
        )

        // expect(result).toBeInstanceOf(AccountEntity);
        expect(result.id).toBe(result.id);

        expect(result.accountType).toBeDefined();
        expect(result.accountType.id).toBe(accountType.id);

        expect(result.users).toBeDefined();
        expect(result.users.id).toBe(user.id);
    });

    it('should find accounts by account type using findByAccountType', async () => {
        const accountTypeId = 2; 
        const actual = await repository.findByAccountType(accountTypeId, { trx });
        const expected = await DB.accounts.query(trx)
            .where({ account_type_id: accountTypeId });

        expect(actual).toBeInstanceOf(Array);
        expect(actual.length).toBe(expected.length);
        actual.forEach(account => {
            expect(account).toBeInstanceOf(AccountEntity);
            expect(account.account_type_id).toBe(accountTypeId);
        });

        const actualIds = actual.map(a => a.id);
        const expectedIds = expected.map(e => e.id);

        expect(actualIds).toEqual(expect.arrayContaining(expectedIds));
        expect(expectedIds).toEqual(expect.arrayContaining(actualIds));
    });
});
```

The DB package is `@vectoricons.net/db`, which is already set up to connect to the live database. You can use it directly in your repository and service classes. Just call `const DB = require('@vectoricons.net/db');` at the top of your files to access the live DB connection. Models are accessed via `DB.modelName`, where `modelName` is the name of the model you want to use (e.g., `DB.accounts`, `DB.${modulename}`, etc.). Refer to `refs/db-models/modelName.js` for the model definitions and schema.
