# Project Architecture

## Service-Oriented Architecture (SOA)

The codebase is organized as independent **modules** communicating through well-defined interfaces. Each module has three primary layers:

- **Entity** — Data model object with controlled exposure (whitelist), optional hidden fields, and helper methods.
- **Repository** — Database access layer (Objection.js), returning fully wrapped Entities.
- **Service** — Business logic layer that orchestrates work using repositories.

Modules live under `src/<module-name>/`. Closely related features may be grouped as submodules (e.g., `accounts/account-types`). Treat submodules as part of the parent module—build and test them together.

## SOLID & DRY Principles

This code base follows SOLID principles:
- **Single Responsibility**: Each class has one reason to change.
- **Open/Closed**: Classes are open for extension but closed for modification.
- **Liskov Substitution**: Subtypes must be substitutable for their base types.
- **Interface Segregation**: Many specific interfaces are better than one general-purpose interface.
- **Dependency Inversion**: Depend on abstractions, not concretions.

It also adheres to the DRY (Don't Repeat Yourself) principle, minimizing code duplication through shared base classes, testing contracts, and mixins.

---

## Module Naming & Layout

**File names use PascalCase** for classes:

- `<ModuleName>Entity.js`
- `<ModuleName>Repository.js`
- `<ModuleName>Service.js`

**Folder layout:**
```
src/
  └── <module-name>/
      ├── <ModuleName>Entity.js
      ├── <ModuleName>Repository.js
      ├── <ModuleName>Service.js
      ├── index.js
      └── __tests__/
          ├── <ModuleName>Entity.test.js
          ├── <ModuleName>Repository.test.js
          └── <ModuleName>Service.test.js

      └── <submodule>/
          ├── SubmoduleEntity.js
          ├── SubmoduleRepository.js
          ├── SubmoduleService.js
          └── __tests__/
              ├── SubmoduleEntity.test.js
              ├── SubmoduleRepository.test.js
              └── SubmoduleService.test.js
```

---

## Layered Architecture

### Interrelationships - IMPORTANT!

The relationships between the Objection.js DB models, the Entity, Repository, and Service classes are central to the design of the code. They are all interconnected, and understanding these relationships is crucial for effective testing. For instance, do not refer to a field when creating a DB row that does not exist in the Entity class. The Objection.js model is the single source of truth for what fields exist. The Entity class is created directly from the Objection.js model. The Service and Repository classes should only refer to fields that exist in the Entity class. The Repository class returns either a single instance of the Entity class or an array of instances of the Entity class. The Service class contains the business logic and uses the Repository class to access the data. Controllers or API routes should only interact with the Service class. NEVER "reach through" the Service class to access the Repository or access the DB models directly. As a matter of style, methods for retrieving data in the Service class use "get*" and the Repository class uses "find*". This semantic distinction is consistent with what the classes "do". Entities are plain data holders with no business logic. They _may_ contain helper methods for manipulating or formatting their own data, but they do not contain business logic. Business logic belongs in the Service class. For instance, an Entity class may have an "is*" function for returning a boolean value based on its own fields, such as `UserEntity.isAdmin()` or `AccountEntity.isActive()`. Otherwise, business logic belongs in the Service class. This clear separation of concerns is inviolate. 

#### Field Names Between Layers

The field names in the database adhere to common Postgresql naming conventions, which typically use snake_case. In contrast, the field names in the Entity classes follow JavaScript conventions and use camelCase. The Repository and Service classes should consistently use camelCase when referring to fields, as they interact with the Entity classes. This means that when writing code in the Repository or Service layers, always use camelCase for field names, even though the underlying database uses snake_case. The mapping between these naming conventions is handled automatically by Objection.js, so developers do not need to manually convert between them.

### Database Layer

The architecture begins with the database tables. Each database table is modeled using Objection.js, which defines the schema, columns, relations, and validation logic. References for the models are stored in `refs/db-models/`. NOTE: These are not the actual models, just references. The models are imported from the `@vectoricons.net/db` package, but they should be identical.

### Entity Layer

The Entity classes are then created based on these models using the `createEntityFromModel` function (in BaseEntity.js). This function generates the Entity class from the BaseEntity, the Objection.js model, and any custom fields and/or methods passed to the `createEntityFromModel` function. 

The relationMappings from the Objection.js model, if present, are used to map the related Entity classes to the Entity class being defined. Not every Entity will have relatedEntities. When applicable, the `relatedEntities` map is passed as part of the `options` parameter to the `createEntityFromModel` function. This allows the Entity class to lazily load related entities when they are accessed. Refer to the example below from the `AccountEntity.js` file:

```javascript
// The Objection.js model relationMappings:
static get relationMappings() {
    const AccountTypes = require('./account-types');
    const Users = require('./users');

    return {
        // We can determine from this relationship that the AccountTypeEntity is related to the AccountEntity
        accountType: {
            relation: Model.BelongsToOneRelation,
            modelClass: AccountTypes,
            join: {
                from: 'accounts.account_type_id',
                to: 'account_types.id'
            }
        },
        // We can determine from this relationship that the UserEntity is related to the AccountEntity
        users: {
            relation: Model.BelongsToOneRelation,
            modelClass: Users,
            join: {
                from: 'accounts.user_id',
                to: 'users.id'
            }
        }
    }
}

// The AccountEntity definition:
class AccountEntity extends createEntityFromModel(DB.accounts, {}, {
    // The Objection.js model indicates the AccountTypes and Users Models are related to the Account Model,
    // therefore, the AccountTypeEntity and UserEntity are likewise related to the AccountEntity.
    relatedEntities: {
        accountType: () => require('./account-types/AccountTypeEntity'),
        users: () => require('../users/UserEntity'),
    },
    allowedColumns: [/* fields to expose when serializing to JSON */],
    hiddenFields: [/* fields to hide when serializing to JSON */]
}){}
```

NOTE: If a field does not appear in `allowedColumns`, it should be assumed to be hidden by default. The `allowedColumns` and `hiddenFields` arrays are optional. If neither is provided, all fields are considered hidden, by default. This is to prevent accidental leakage of sensitive data.

When adding comments to classes, use JSDoc format to document the class and its methods. Include a `@see` tag that points to the corresponding Objection.js model file in `/refs/db-models/`.

#### Example Entity creation demonstrating relationMappings and allowedColumns:

```js
// Path: src/accounts/AccountEntity.js

const DB = require('@vectoricons.net/db');
const { createEntityFromModel } = require('../common/BaseEntity');
// const AccountTypeEntity = require('./account-types/AccountTypeEntity');

/**
 * Represents an account entity in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/accounts.js} Objection.js model for accounts 
 */
class AccountEntity extends createEntityFromModel(DB.accounts, {}, {
    allowedColumns: [
        'id',
        'user_id',
        'account_type_id',
        'label',
        'description',
        'status',
        'balance',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        accountType: () => require('./account-types/AccountTypeEntity'),
        users: () => require('../users/UserEntity'),
    },
}){}

module.exports = AccountEntity;
```

#### Example CartEntity.js (more complex example with custom methods)

Entities can also have custom methods added to them. These methods are passed as an object to the `createEntityFromModel` function. See the example below from the `CartItemEntity.js` file:

```javascript
// Path: src/carts/CartItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

class CartItemEntity extends createEntityFromModel(DB.cartItems, {
    getPrice() {
        return this.price;
    }

    isFor(entityId, entityType) {
        return this.entity_id === entityId && this.entity_type === entityType;
    }

    isActive() {
        return this.is_active !== false;
    }
});

module.exports = CartItemEntity;
```

Notices that extra methods are passed as an object to the `createEntityFromModel` function. This allows you to add custom methods to the entity class while still benefiting from the base functionality provided by BaseEntity.

## Base Classes

In adherence to the SOLID and DRY principles, common functionality is abstracted into base classes located in the `src/common/` directory. These base classes include:

- **BaseEntity**: Provides common entity functionality, including serialization and cloning.
- **BaseRepository**: Encapsulates common database operations, ensuring consistent data access patterns.
- **BaseService**: Implements shared business logic patterns, facilitating code reuse across services.


## Mixins

Many modules add behavior to their **Service** (and sometimes **Entity/Repository**) classes via *mixins*. A mixin is a function that takes a base class and returns an extended class with extra methods/semantics. Because mixins are composed per-module, **not every module supports every capability**. Tests and new features must **detect** what a module actually uses—never assume.

See the section named `# Mixins (Capabilities)` in this file for complete details.


### BaseEntity Class

The BaseEntity class provides a common foundation for all entities, including:

- A constructor that accepts a model instance and filters input based on the model’s jsonSchema.
- A toJSON() method that serializes the entity, ensuring all defined schema properties are included
- A cloneWith(updates = {}) method that creates a new instance with updated properties, preserving immutability.
- BaseEntity can be used directly if you need to create an entity that does not correspond to a specific Objection.js model.
- The createEntityFromModel function returns a new class that itself extends BaseEntity. Since createdEntityFromModel returns a class, you can extend the return value the same as if were referencing a class directly.
- Easily instantiate testable mock entities via EntityClass.from(data).

#### The BaseEntity: 

```javascript
"use strict";

const DB = require('@vectoricons.net/db');

class BaseEntity {

    hiddenFields = [];

    constructor(data = {}) {
        if (!data || typeof data !== 'object') return;
        const hidden = this.constructor.hiddenFields || [];
        for (const field of hidden) {
            if (field in data) {
                delete data[field];
            }
        }
        Object.assign(this, data);
        // Object.freeze(this);
    }

    cloneWith(updates = {}) {
        return new this.constructor({ ...this, ...updates });
    }

    toJSON() {
        const json = {};

        for (const key of Object.getOwnPropertyNames(this)) {
            const val = this[key];

            json[key] = val;
            if (Array.isArray(val)) {
                json[key] = val.map(item =>
                    typeof item?.toJSON === "function" ? item.toJSON() : item
                );
            } 
            else if (typeof val?.toJSON === "function") {
                json[key] = val.toJSON();
            }
        }

        return json;
    }
}
 
 // The `createEntityFromModel` function is saved in the same file as BaseEntity.js

const createEntityFromModel = (
    ModelClass,
    extraMethods = {},
    { hiddenFields = [], relatedEntities = {} } = {}
) => {
    class ModelEntity extends BaseEntity {
        static relatedEntities = relatedEntities;
        static hiddenFields    = hiddenFields;

        constructor(data = {}) {
            const schemaProps     = ModelClass.jsonSchema?.properties || {};
            const baseFields      = {};
            const relationFields  = {};

            for (const key of Object.keys(data)) {
                if (key in schemaProps) baseFields[key] = data[key];
                else relationFields[key] = data[key];
            }

            super(baseFields);

            for (const [key, val] of Object.entries(relationFields)) {
                const getEntity = this.constructor.relatedEntities?.[key];
                if (!getEntity) {
                    this[key] = val;
                    continue;
                }

                const EntityClass = getEntity();
                this[key] = Array.isArray(val)
                    ? val.map(v => new EntityClass(v))
                    : new EntityClass(val);
            }

            Object.freeze(this);
        }
    }

    Object.assign(ModelEntity.prototype, extraMethods);
    ModelEntity.model = ModelClass;

    return ModelEntity;
};
```

### Repository Layer

The Repository classes extend the `BaseRepository` class, which provides common database interaction methods. All data manipulation logic is encapsulated within these repositories, ensuring a clean separation of concerns. Repositories must return fully instantiated Entity instances (never raw model objects).

#### Example Repository creation:

```js
// Path: src/accounts/AccountRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../common/BaseRepository');
const AccountEntity = require('./AccountEntity');

/**
 * AccountRepository class
 * @class AccountRepository
 * @description This class is responsible for managing accounts data.
 * @param {Object} options - Options for the repository.
 * @param {Object} options.DB - The database instance.
 * @extends BaseRepository
 */
class AccountRepository extends BaseRepository {
    constructor({ DB }) {
        super({ 
            DB, 
            modelName: 'accounts', 
            entityClass: AccountEntity
        });
    }

    /**
     * Find accounts by user ID.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} - A promise that resolves to an array of accounts.
     * @throws {Error} - If the user ID is not provided or if an error occurs during the database query.
     */
    async findByUserId(userId) {
        const accounts = await this.model.query().where({ user_id: userId });
        return this.wrapEntity(accounts, AccountEntity);
    }

    /**
     * Find accounts by account type ID.
     * @param {number} accountTypeId - The ID of the account type.
     * @returns {Promise<Array>} - A promise that resolves to an array of accounts.
     * @throws {Error} - If the account type ID is not provided or if an error occurs during the database query.
     */
    async findByAccountType(accountTypeId) {
        const accounts = await this.model.query().where({ account_type_id: accountTypeId });
        return this.wrapEntity(accounts, AccountEntity);
    }
}

module.exports = AccountRepository;
```

#### Polymorphic Associations

A common pattern used in the project is `polymorphic associations`, which allows for flexible relationships between different entities. You will see this appear in numerous tables as `entity_type` (icon, illustration, set, family, user, etc.) and `entity_id` (the ID of the related entity). This allows for a single table to store different types of entities, making it easier to manage relationships and queries.

### Service Layer

The Service classes orchestrate the business logic, using the repositories to access and manipulate data. They implement methods that correspond to the use cases of the module.

#### Example Service creation:

```js
// Path: src/accounts/AccountService.js
const BaseService = require('../common/BaseService');
const AccountEntity = require('./AccountEntity');
const AccountRepository = require('./AccountRepository');
// const { initAccountTypesService } = require('./account-types/index.js');


class AccountService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository   : repository || new AccountRepository({
                DB: require('@vectoricons.net/db'),
            }),
            entityClass  : entityClass || AccountEntity,
        });
    }

    /**
     * Find accounts by user ID.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} - A promise that resolves to an array of accounts.
     * @throws {Error} - If the user ID is not provided or if an error occurs during the database query.
     */
    async findByUserId(userId) {
        return this.repository.findAll(
            { user_id: userId },
            { entityClass: this.entityClass }
        );
    }

    /**     
     * Get account types service instance.
     * @returns {AccountTypesService} - An instance of AccountTypesService.
     */
    async getByAccountType(accountTypeId) {
        return await this.repository.findByAccountType(accountTypeId);
    }

    /**
     * Get the balance of an account by its ID.
     * @param {string} accountId - The ID of the account.
     * @returns {Promise<number>} - A promise that resolves to the balance of the account.
     * @throws {Error} - If the account ID is not provided or if an error occurs during the database query.
     */
    async getBalance(accountId) {
        const account = await this.getById(accountId);
        return account?.balance ?? 0;
    }
}

module.exports = AccountService;
```

#### Service Initialization:

Each module should include a function to initialize the service and inject dependencies. The function follows the format below:

```js
// Path: src/accounts/index.js
const AccountTypes = require('./account-types');
const AccountEntity      = require('./AccountEntity');
const AccountRepository  = require('./AccountRepository');
const AccountService     = require('./AccountService');

/**
 * Initializes the AccountService with injected dependencies.
 * @returns {AccountService}
 */
const initAccountService = () => {
    return new AccountService({
        repository: new AccountRepository({ DB : require('@vectoricons.net/db') }),
        entityClass: AccountEntity,
    });
};

module.exports = {
    AccountTypes,
    AccountEntity,
    AccountRepository,
    AccountService,
    initAccountService,
};
```

# Mixins (Capabilities)

Many modules add behavior to their **Service** (and sometimes **Entity/Repository**) classes via *mixins*. A mixin is a function that takes a base class and returns an extended class with extra methods/semantics. Because mixins are composed per-module, **not every module supports every capability**. Tests and new features must **detect** what a module actually uses—never assume.

## How mixins are composed

Two helpers are used:

```js
// One-shot composition
const composeService = (Base, mixins = []) =>
    mixins.reduce((Cls, mixin) => mixin(Cls), Base);

// Curried composition (pre-bake a combo, then apply)
const composeWith = (...mixins) => (Base) =>
    mixins.reduce((Cls, mixin) => mixin(Cls), Base);
```

Convenience combos exist (e.g., `withPluggable`, `withSoftDeletable`, `withPluggableAndCacheable`, etc.), built from the individual mixins below.

## Common service mixins and what they add

- **PluggableService**
  - *Intent:* lightweight plugin system for features/hooks.
  - *Typical surface:* `registerPlugin(plugin)`, internal hook execution.
- **CacheableService**
  - *Intent:* read-through/explicit cache support.
  - *Typical surface:* methods to fetch with cache and to invalidate keys.
- **ActivatableService**
  - *Intent:* toggle logical activation flags (often `is_active`, sometimes paired with filtering).
  - *Typical surface:* `activate(id)`, `deactivate(id)`, `toggleActive(id)`, `getActive(...)`.
- **SoftDeletableService**
  - *Intent:* logical deletion without dropping rows.
  - *Typical surface:* `softDelete(id)` (and sometimes restore); often coupled with `ActivatableService`.
- **ObservableService**
  - *Intent:* fire/subscribe to domain events.
  - *Typical surface:* `on(event, handler)`, internal `emit(...)`.
- **AccessControllableService**
  - *Intent:* access control checks integrated into service calls.
  - *Typical surface:* policy/guard evaluation before operations.

> Note: Some exported “combos” (e.g., `withSoftDeletable`) deliberately stack multiple mixins (e.g., SoftDeletable + Activatable). Do not infer the presence of a capability unless it’s actually composed in the module.

## How to determine which capabilities a module uses

When working on a module (tests or code), **inspect the module’s code**:

1. **Service file** (`src/<module>/<Module>Service.js`)
   - Look for imports from `src/common/mixins/service`.
   - Look for composition such as:
     ```js
     const { withPluggableAndCacheable } = require('../common/mixins/service');
     class FooService extends withPluggableAndCacheable(BaseService) {}
     ```
   - Or one-shot composition:
     ```js
     class FooService extends composeService(BaseService, [PluggableService, CacheableService]) {}
     ```
2. **Module index** (`src/<module>/index.js`)
   - Sometimes the init function composes the service there—check for `composeWith(...)` usage.
3. **Method presence**
   - As a last resort, gate behavior in tests/features by checking methods at runtime:
     ```js
     const supportsSoftDelete = typeof service.softDelete === 'function';
     const supportsActivate   = typeof service.activate === 'function'
         && typeof service.deactivate === 'function';
     ```
4. **Entity/Repository**
   - Some modules also compose entity/repository mixins. Apply the same “inspect then gate” approach.

## Guidance for tests and features

- **Only test capabilities that exist.** Use capability gates and `test.skip(...)` (or conditional blocks) when a mixin isn’t present.
- **Do not assume** a module supports soft delete, activation, caching, plugins, observability, or access control unless composition proves it.
- If adding a new capability to a module, explicitly compose the mixin and then add/enable matching tests.

This capability-driven approach prevents false assumptions and keeps modules lean: each module opts into only the behaviors it needs, and tests adapt accordingly.

### Testing classes

See `TEST-STRATEGY.md` for an overview of the testing strategy.

Refer to the section named `### Interrelationships - IMPORTANT!` above for important guidelines on testing classes. Always adhere to these relationships when writing tests. Do not refer to a field in a test that does not exist in the Entity class. 

NOTE: DO NOT delete tests simply because they are failing. Instead, fix the tests to adhere to the relationships described above. If you are unable to fix the tests, please ask for help. I will manually resolve the issue and we will proceed from there.

### Testing Guidelines to NEVER Violate
- DO NOT modify code to the tests. Tests should validate the code, not the other way around.
- DO NOT skip a test just because it won't pass. Tests should always pass. If a test is failing, it indicates a problem that needs to be addressed. Ask your human for help if you are unable to fix the test after several attempts.
- DO NOT truncate tables unless explicitly instructed to do so. Truncating tables can lead to data loss and inconsistencies in tests. Always use transactions to isolate tests and ensure a clean state. See the section labeled "Truncating Tables in Tests" below for a list of tables it is safe to truncate. If a table is not on the list, assume it cannot be truncated.
- NEVER CREATE, DELETE, or MODIFY tables in the DB. NEVER!

### OK to truncate these tables in tests
- tags
- categories
- entity-to-categories
- entity-to-tags
- coupon_codes
- coupon_codes_to_orders
- favorites

### NEVER TRUNCATE - FOR ANY REASON.
- users
- users_to_email
- user_roles
- user_to_roles
- users_to_subscription_plans
- users_to_social
- families
- sets
- icons
- illustrations
- subscription_plans
- accounts
- account_types
- carts
- cart_items
- orders
- order_items
- transactions
- transaction_types
- transaction_items
- transaction_cateogries
- styles
- images
- image_types
- downloads
- licenses
- knex* (nothing with knex in the name)
- login_history
- invoices
- stripe_events
- stripe_customers
- sripe_payment_methods
- purchase_history
- purchases_by_entity_type
- protected_entities
- purchased_items
- search_activity
- filter_words
- banned_words
- credits
- credit_history
- credit_download
- credit_balance

### Understanding Test Contracts
The codebase includes a set of predefined test contracts that can be used to test the common behaviors of services, repositories, and entities. These contracts are located in the `src/__tests__/contracts/` directory. They provide a standardized way to ensure that the basic functionality of these classes is working as expected.

When writing tests for a new module, you can leverage these contracts to avoid duplicating common test cases. Each contract requires you to provide specific configuration options, such as the name of the module, the function to initialize the service or repository, the entity class, and a function to generate a unique seed for creating instances of the entity.

DO NOT modify the contracts unless explicitly instructed to do so. Instead, use them as-is to validate the behavior of your module. If a given contract is not compatible with a given module, skip the contract and write custom tests instead. Always ask for help if you are unsure.

#### Custom vs Contract Tests

When writing test files for contract tests, vs custom tests, contract tests should go in in `service.test.js`, `repository.test.js`, or `entity.test.js` files. Custom tests should go in `service.custom.test.js`, `repository.custom.test.js`, or `entity.custom.test.js` files. This keeps the contract tests separate from the custom tests, preventing overlap of DB sessions and prevents the end of one set of tests from interfering with the start of another set of tests.

#### service.contract.js
The `service.contract.js` file provides a set of tests that cover the common behaviors expected from a service class. To use this contract, you need to provide the following configuration options:

```javascript
/**
 * serviceContract(config)
 *
 * Supported patterns:
 *  A) initService: () => instance of the real service (already wired)
 *  B) ServiceClass + initRepository: we construct the service for you
 *
 * Required:
 * - name: string
 * - Entity: entity class
 * - seedOne: async ({ trx }) => minimal valid data object
 *
 * One of:
 * - initService: () => ServiceInstance (preferred if you already wire repository+entity)
 * OR
 * - ServiceClass + initRepository: () => RepositoryInstance
 *
 * Optional:
 * - whereForExisting: (row) => where clause for a created row  (default: { id: row.id })
 * - whereForUnique:   (data) => unique where for inserts       (e.g., { word: data.word })
 * - supportsSoftDelete: boolean (default false)
 * - supportsActivation / supportsActivate: boolean (default false) – both accepted
 */
const serviceContract = ({
    name,                // Name of the module (e.g., 'Account')    
    initService,         // Function to initialize the service, ie, initAccountService from ./src/accounts/index.js
    ServiceClass,        // The actual Service class, ie, AccountService from ./src/accounts/AccountService.js
    initRepository,      // Function to initialize the repository, ie, initAccountRepository from ./src/accounts/index.js
    Entity,              // The Entity class, ie, AccountEntity from ./src/accounts/AccountEntity.js 
    seedOne,             // Function that returns a unique seed object for creating an entity instance
    whereForExisting = (row) => ({ id: row.id }), // Function to generate a where clause for an existing entity
    whereForUnique,    // Function to generate a where clause for a unique entity (e.g., unique fields)
    supportsSoftDelete = false, // Boolean indicating if the service supports soft delete
    supportsActivation,  // Boolean indicating if the service supports is_active toggling
    supportsActivate,    // Boolean indicating if the service supports activate/deactivate methods
}) => { ... }
```

#### Example usage of service.contract.js

```javascript
// src/accounts/__tests__/AccountService.contract.test.js
/* eslint-env jest */

const { initAccountService } = require('../index');
const DB = require('@vectoricons.net/db');
const serviceContract = require('../../__tests__/contracts/service.contract');
const AccountService = require('../AccountService');
const AccountRepository = require('../AccountRepository');
const AccountEntity = require('../AccountEntity');

/** 
 * Creates a unique seed for the account entity.
 * @returns {Object} A seed object for creating an account.
 */
const seedOne = () => ({
    user_id         : 1,
    account_type_id : 2,
    label           : `acct-${Math.random().toString(36).slice(2, 8)}`,
    description     : `Test account ${Math.random().toString(36).slice(2, 8)}`,
    status          : 'active',
    balance         : 0,
});

// ===============================================================
// Contract tests for AccountService
// ===============================================================

serviceContract({
    name                : 'Account',
    initService         : initAccountService,
    Entity              : AccountEntity,
    seedOne             : seedOne,
    supportsActivation  : false,
    supportsSoftDelete  : false,
    whereForUnique: (data) => ({
        user_id : data.user_id,
        label   : data.label,
    }),
});
```

### repository.contract.js
@see src/__tests__/contracts/repository.contract.js for complete code.

The `repository.contract.js` file provides a set of tests that cover the common behaviors expected from a repository class. To use this contract, you need to provide the following configuration options:

```javascript
/**
 * repositoryContract(config)
 *
 * Required config:
 * - name: string (for describe block)
 * - initRepository: () => instance of the module's repository
 * - Entity: the entity class for the module (expected entity)
 * - seedOne: (opts) => Promise<rowData>  // returns minimal valid data object (POJO, camelCase)
 *
 * Optional config:
 * - seedMany: (opts) => Promise<Array<rowData>>
 * - whereForExisting: (createdRow) => where clause to re-find created
 * - relationGraph: string | null // e.g. "[accountType, users]"
 * - whereForUnique: (data) => where clause that targets a unique key for inserts (e.g. { word: data.word })
 * - pickIds: async (repository, trx) => Promise<Array<number>>  // for findByIds
 * - supportsRelations: boolean // enables withRelations test
 * - modelName: string // e.g. 'bannedWords' - verifies correct model wiring
 */
const repositoryContract = ({
    name,
    initRepository,
    Entity,
    seedOne,
    seedMany,
    whereForExisting = (row) => ({ id: row.id }),
    relationGraph = null,
    whereForUnique,
    pickIds,
    supportsRelations = false,
    modelName,
}) => { ... }
```

#### Example usage of repository.contract.js

```javascript
/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const AccountRepository = require('../AccountRepository');
const AccountEntity = require('../AccountEntity');

const seedOne = async () => ({
    user_id         : 1,
    account_type_id : 2,
    label           : `acct-${Math.random().toString(36).slice(2, 8)}`,
    description     : `Test account ${Math.random().toString(36).slice(2, 8)}`,
    status          : 'active',
    balance         : 0,
});

const initRepository = () => {
    return new AccountRepository({ DB });
}

const whereForExisting = (row) => {
    return { id: row.id };
};

repositoryContract({
    name              : 'Account',
    initRepository    : initRepository,
    Entity            : AccountEntity,
    seedOne           : seedOne,
    whereForExisting  : whereForExisting,
    supportsRelations : true,
    relationGraph     : '[accountType, users]',
    modelName         : 'accounts',
});
```

#### entity.contract.js
@see src/__tests__/contracts/entity.contract.js for complete code.

The `entity.contract.js` file provides a set of tests that cover the common behaviors expected from an entity class. To use this contract, you need to provide the following configuration options:

```javascript
/**
 * entityContract(config)
 *
 * Validates that an Entity built with BaseEntity + createEntityFromModel:
 *  - keeps only model schema fields (camelCase) and ignores unknowns
 *  - materializes declared relations (if provided in the input)
 *  - toJSON() returns camelCase data and recurses into nested entities
 *  - cloneWith() returns a new instance and does not mutate the original
 *
 * Required:
 *  - name: string
 *  - Model: Objection model with jsonSchema.properties
 *  - Entity: the entity class produced by createEntityFromModel(Model, ...)
 *  - seed: () => base camelCase object that corresponds to model schema
 *
 * Optional:
 *  - makeRelations: () => object with relation-shaped data using the
 *    entity’s declared relation keys (Entity.relatedEntities)
 *  - hiddenFields: string[] of camelCase fields to consider hidden
 *  - updateOne: (base) => patch object passed into cloneWith()
 *      If omitted, the cloneWith test is skipped.
 */
const entityContract = ({
    name,
    Model,
    Entity,
    seedOne,
    makeRelations,
    hiddenFields = [],
    updateOne, // optional
})=> { ... }
```

#### Example usage of entity.contract.js

Note that the entity contract test example below not only uses the contract, but also includes additional bespoke tests specific to the `AccountEntity` class. While most classes will use the contract, some may require additional tests to cover unique behaviors or methods.

```javascript
/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const entityContract = require('../../__tests__/contracts/entity.contract');
const AccountEntity = require('../AccountEntity');

/**
 * Base camelCase seed that matches the accounts model schema.
 * No persistence; just a plain object for entity construction.
 */
const seedOne = () => {
    return {
        id: 0,
        userId: 1,
        accountTypeId: 2,
        label: `acct-${Math.random().toString(36).slice(2, 8)}`,
        description: `Seed account ${Math.random().toString(36).slice(2, 6)}`,
        status: 'active',
        balance: 0,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
}

const updateOne = (row) => {
    return {
        id: row.id,
        userId: row.userId,
        accountTypeId: row.accountTypeId,
        label: `updated-${row.label}`,
        description: `Updated account ${Math.random().toString(36).slice(2, 6)}`,
        status: 'active',
        balance: row.balance + 100,
        createdAt: row.createdAt,
        updatedAt: new Date('2024-01-03T00:00:00Z'),
    };
};

/**
 * Relation-shaped data using the entity’s declared relation keys.
 * These are plain JS objects; the entity factory will wrap them.
 */
function makeRelations() {
    return {
        accountType: { id: 2, value: 'buyer', createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-02T00:00:00Z') },
        users: { id: 11, email: 'a@b.com', createdAt: new Date('2024-01-01T00:00:00Z'), updatedAt: new Date('2024-01-02T00:00:00Z') },
    };
}

entityContract({
    name: 'AccountEntity',
    Model: DB.accounts,
    Entity: AccountEntity,
    seedOne: seedOne,
    updateOne: updateOne,
    makeRelations,
    hiddenFields: [],
});

describe('AccountEntity', () => {
    const baseData = {
        id              : 1,
        userId          : 101,
        accountTypeId   : 2,
        label           : 'Main Account',
        description     : 'Primary account for payouts',
        status          : 'active',
        balance         : 50.25,
        createdAt       : '2024-01-01T00:00:00.000Z',
        updatedAt       : '2024-01-02T00:00:00.000Z'
    };

    test('should correctly assign values from constructor', () => {
        const entity = new AccountEntity(baseData);

        expect(entity.id).toBe(baseData.id);
        expect(entity.userId).toBe(baseData.userId);
        expect(entity.accountTypeId).toBe(baseData.accountTypeId);
        expect(entity.label).toBe(baseData.label);
        expect(entity.description).toBe(baseData.description);
        expect(entity.status).toBe(baseData.status);
        expect(entity.balance).toBe(baseData.balance);
        expect(entity.createdAt).toBe(baseData.createdAt);
        expect(entity.updatedAt).toBe(baseData.updatedAt);
    });

    test('should return correct JSON structure from toJSON()', () => {
        const entity = new AccountEntity(baseData);
        expect(entity.toJSON()).toEqual(baseData);
    });

    test('should be immutable (Object.freeze)', () => {
        const entity = new AccountEntity(baseData);

        expect(Object.isFrozen(entity)).toBe(true);

        const original = entity.label;
        // Attempt a mutation; in non-strict mode this won't throw, but state must not change.
        try { entity.label = 'Tampered'; } catch (_) {}
        expect(entity.label).toBe(original);
    });
});
```

### Validators

Validators are used to ensure that the data being processed by the services meets the required criteria. They are typically implemented as standalone functions or classes and can be imported into the service classes as needed. Not all modules will include validators. When they are needed, the naming follows the pattern `<ModuleName>Validator.js`.

### Add-hoc Classes & functions

In some instances, additional classes or functions may be needed to support specific functionality within a module. These should be placed in the module's directory and follow the naming conventions established for that module. For example, if a module requires a utility class, it might be named `<ModuleName>Utils.js`.

### Shared Code

Shared code that is used across multiple modules should be placed in the `src/common/` directory. This includes base classes, utility functions, and other shared resources. The naming conventions for shared code follow the same patterns as module-specific code.

⸻