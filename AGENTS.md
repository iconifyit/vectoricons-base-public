# AGENTS.md

This file provides comprehensive guidance for AI coding agents working with this codebase. It outlines the project structure, coding conventions, testing requirements, and specific implementation guidelines for various modules.

## Project Overview & Goals

* **Project Name**: VectorIcons.net Base Service Oriented Architecture (SOA) Framework
* **Purpose**: A foundational framework for the VectorIcons.net multi-vendor, e-commerce marketplace REST API and other services/apps.
* **Technologies**: Node.js (JavaScript/ES6), Express.js, Next.js, PostgreSQL, Objection.js, AWS services.
* **Overall Vision**: To create a scalable, maintainable, and extensible architecture that supports the growth of the VectorIcons.net marketplace and its ecosystem of services.

## Agent Roles & Responsibilities
* **Developer Agent**: Assist in generating, refactoring, and maintaining code across the project. Implements code based on specifications, writes utility libraries, and ensures adherence to style guidelines.
  
---

## About VectorIcons.net

VectorIcons.net is a multi-vendor, e-commerce marketplace that provides a platform for users to buy and sell vector icons and illustrations. The project is built using a Service-Oriented Architecture (SOA) pattern, which allows for modular development and easy integration of new features. The front-end is built using Next.js, while the back-end is implemented with Node.js and Fastify. The project uses PostgreSQL as the database and Objection.js for ORM functionality.

## Architecture Overview

For a complete overview of the architecture, refer to the [ARCHITECTURE.md](./ARCHITECTURE.md) document.

### Namespace and Imports

- The ONLY DB package is `@vectoricons.net/db`, which provides the database connection and model definitions. Any other DB package referenced in the code, ie, `@vectopus.com/db` is a legacy reference and should not be used. When following existing code as a model, replace `@vecopus.com/db` with `@vectoricons.net/db` in any new code that is modeled after existing code. DO NOT replace references to `vectopus` with `vectoricons` unless asked to do so, explicitly. There may be legacy dependencies that still use the `vectopus` namespace. But NEW CODE should never use `vectopus` namespace.
- Do NOT introduce `vectopus|vectoplus` anywhere (code, tests, comments, or filenames).
- Legacy `vectopus|vectoplus` identifiers MAY remain where currently used; do not rename them unless a task explicitly says so.
- App-internal imports are relative (e.g., ../common/BaseRepository, ../common/BaseService).

## Code Style

This guide follows the project-wide conventions defined in
[ARCHITECTURE.md → Coding Conventions](./ARCHITECTURE.md#coding-conventions).
Please refer there as the single source of truth.

### Data Structure

The source of truth for the data design is the database schema found in `./refs/schema.sql`. 

### Polymorphic Associations

A common pattern used in the project is `polymorphic associations`, which allows for flexible relationships between different entities. You will see this appear in numerous tables as `entity_type` (icon, illustration, set, family, user, etc.) and `entity_id` (the ID of the related entity). This allows for a single table to store different types of entities, making it easier to manage relationships and queries.

### Product Structure

VectorIcons.net currently sells two types of products - icons and illustrations - structured as follows:

- **Icons / illustrations**: Individual vector icon files. Individual items have a `style` as indicated by the `style_id` column which is related to the `styles` table via `icon.style_id = styles.id`. Icons and illustrations are stored in the `icons` and `illustrations` tables, respectively.
- **Sets**: Collections of related icons or illustrations, sold as a single product. A set contains either icons or illustrations, but never both in the same set. A set has a product_type (type_id) that is either an icon or an illustration. The product type  is indicated in the `product_types` table related to the individual icon or illustration via the `type_id` field. Sets also have a `style` as indicated by the `style_id` column which is related to the `styles` table via `set.style_id = styles.id`.
- **Families**: A family is a collection of one or more sets. A family does not have a style or product type because a family may contain multiple sets with both icons and illustrations in more than one style.

Put another way, icons and illustrations are individual items. A set is a collection of either icons or illustrations, but not both. A family is a collection of collections (collection of sets) and may contain icon sets and illustration sets. Sets will have a style (solid, flat, outline, etc.) and product type (icon or illustration) but families do not have a style or product type because they may contain multiple sets with different styles and product types.

We plan to add new product types in the future, such as templates, logos, etc. Keep this in mind when writing code. Avoid code that makes it difficult to add new product types in the future.

### Images

Images metadata is stored in the `images` table and related to their respective entities via polymorphic associations. The `entity_type` and `entity_id` columns in the `images` table allow for flexible relationships with icons, illustrations, sets, and families. Images can be used for product listings, user profiles, and other visual elements across the platform. Entities can, and most do, have multiple image sizes and formats. Products, in particular will usually have both _svg_, _png_, and _webp_ format images. The actual images are stored in an AWS S3 bucket. Lo-res images are stored in `vectoricons-public` and hi-res images are stored in `vectoricons-private`. The path to an image is:

Lo-res: `vectopus-public/<contributor-username>/(icons|illustrations)/<family-unique-id>/<set-unique-id>/<image-file-name>`
Hi-res: `vectopus-private/<contributor-username>/(icons|illustrations)/<family-unique-id>/<set-unique-id>/<image-file-name>`

### Images Table Schema

```
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    entity_id integer NOT NULL,
    entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['family'::text, 'icon'::text, 'illustration'::text, 'set'::text, 'user'::text, 'team'::text, 'category'::text])),
    visibility text NOT NULL CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text, 'hidden'::text])),
    access text NOT NULL CHECK (access = ANY (ARRAY['admin'::text, 'owner'::text, 'customer'::text, 'purchaser'::text, 'subscriber'::text, 'user'::text, 'all'::text])),
    name character varying(255) NOT NULL,
    file_type text NOT NULL CHECK (file_type = ANY (ARRAY['png'::text, 'svg'::text, 'webp'::text])),
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    image_hash character varying(255),
    unique_id character varying(12) DEFAULT "right"(uuid_generate_v4()::text, 12) UNIQUE,
    image_type_id integer REFERENCES image_types(id),
    color_data character varying(255),
    object_key character varying(255),
    is_active boolean NOT NULL DEFAULT true,
    is_deleted boolean
);
```

### Product Owner

Products are owned by a `user` and associated via `user.id` where `user.id = `icons.id`| `illustrations.id` | `sets.id` | `families.id`. The user is the creator of the product and is responsible for managing its details, including pricing (within parameters), availability, and metadata.

### Product License

VectorIcons.net uses two categories of licenses: free and premium. There are two types of free licenses: MIT License and Hybrid Free Use License. Premium Licenses are applied to products that are sold.

### Product Prices

Individual icons are always $2 each and individual illustrations are always $5 each. Sets and families have a price that is determined by the product owner. The price is the price column on the individual item, set, and family to which it belongs.

### User Roles

VectorIcons.net has the following user roles which are stored in the `user_roles` table:

- **customer**: A user who can purchase products from the marketplace.
- **contributor**: A user who can submit new products to the marketplace.
- **subscriber**: A user with a paid subscription (monthly or annually)
- **admin**: A user with full access to the platform, including user management and content moderation.
- **contributor_pending**: A user who has applied to be a contributor but has not yet been approved.
- **contributor_denied**: A user who has applied to be a contributor but has been denied.
- **deny_all**: A role assigned to a user to block all access without deleting the user
- **team_owner** (Not implemented) the owner of a team (a group of associated users).
- **team_member** (Not implemented) a member of a team (a group of associated users).
- **super_admin**: (Not implemented) A user with full access to the platform, including user management and content moderation, but with additional privileges such as managing system settings and configurations.
- **guest**: (not an official role) A default, unauthenticated user. This role is applied by default but is not stored in the roles table.

Roles are assigned to users via the `user_to_roles` table where `user_to_roles.user_id` =  `users.id` and `user_to_roles.role_id` = `user_roles.id`. The user can have multiple roles, and the roles can be used to control access to different parts of the platform.

### Conditional Blocks and Simplification Guidelines

Always format conditional blocks with consistent style:

✅ Preferred style:

```javascript
if (condition) {
    // code block
} 
else if (anotherCondition) {
    // another code block
} 
else {
    // default code block
}
```

❌ Avoid this style:

```javascript
if (condition) {
    // code block
} else if (anotherCondition) {
    // another code block
} else {
    // default code block
}
```

### Eliminate Redundant `else` Branches

Avoid unnecessary `else` blocks when the `if` branch contains a `return`, `throw`, or other terminating statement.

❌ Overly verbose:

```js
if (condition) {
    return 1;
} 
else {
    return 2;
}
```

✅ Simplified:

```javascript
if (condition) {
    return 1;
}
return 2;
```

Similarly, avoid verbose if/else assignments when a default value can be declared upfront.

❌ Overly verbose:

```javascript
let value;
if (condition) {
    value = 1;
}
else {
    value = 2;
}
```

✅ Simplified:

```javascript
let value = 2;
if (condition) {
    value = 1;
}
```

### Ternary Operator Usage
Use ternary operators for simple assignments, but avoid them for complex logic or multiple statements. Ternary operators should choose between two values, never to choose between actions/function calls.

✅ Correct usage:

```javascript
const value = condition ? 1 : 2;
```

❌ Incorrect usage:

```javascript
condition ? doSomething() : doSomethingElse();
```

Do not include more than 2 ternary operators in a single expression. If you need to use more than 2, use an `if` statement instead.

Incorrect usage:

```javascript
const value = condition1 ? 1 : condition2 ? 2 : condition3 ? 3 : 4;
```

✅ Correct usage:

```javascript
let value = 4;
if (condition1) {
    value = 1;
} 
else if (condition2) {
    value = 2;
} 
else if (condition3) {
    value = 3;
}
```

⸻

## Files & Folders to Ignore - Do not modify, delete, or use these items.
- _archive
- scaffold/**
- src/scratch.*
- src/scratch-.*
- src/scratch/**
- src/export.js
- /Coding Agents-task-template.md - Template for Coding Agents tasks. Coding Agents should not modify this file.
- /pg-dump.sh - Script to dump the PostgreSQL schema. Coding Agents should not modify this file.
- _archive/AGENTS-bak.md - Backup of the AGENTS.md file. IGNORE this file and its contents.
- _archive/ARCHITECTURE-bak.md - Backup of the ARCHITECTURE.md file. IGNORE this file and its contents.

## Project Structure for Coding Agent Navigation

- /src - the central location for all source code that Coding Agents should analyze
    - /__tests__ - Global tests like smoke test. Does not include module-specific unit tests
    - /accounts - The Accounts module

  - /auth
      - /auth/login-events -- Ignore for now
      - /auth/login-histories
      - /auth/logins -- Ignore for now
      - /auth/password-reset-events -- Ignore for now
      - /auth/signup-events -- Ignore for now

  - /aws - AWS Cloud related classes. Subfolders-each represent a different AWS service (eg, S3, SNS, etc).
  - /billing-periods - Ignore. Do not delete.
  - /carts - Cart and CartItems modules
  - /cashout-requests - Cashout request modules
  - /common - Common utilities module. Does not follow the SOA pattern of the other data modules.
  - /config - Configuration files for the project. Coding Agents should not modify these files.
  - /coupon-codes - Coupon-code related module and sub-modules
  - /credits - Pre-paid credits SOA module
  - /db - Database-related classes. db module does not follow the SOA pattern for the other modules. It is a global utility module.
  - /downloads
  - /email-histories
  - /event-histories
  - /favorites
  - /images
  - /licenses
  - /orders
  - /products
  - /purchased-items
  - /search
  - /stripe
  - /transactions
  - /users
  - /utils
  - /export.js  -- Ignore for now but do not delete.
  - /index.js
  
- /docs - Documentation files for the project. Coding Agents should not modify these files.
  - /index.md - The main documentation file for the project.
  - /overview.md - Overview of the stacks IaC.
  - /iam.md - IAM stack documentation.
  - /vpc.md - VPC stack documentation.
  - /alb.md - ALB stack documentation.
  - /messenger.md - Messenger stack documentation.
  - /uploads.md - Uploads stack documentation.

- /refs - Reference files for the project. Coding Agents should not modify these files.
  - /db-models - Read-only mirror of the Objection.js model definitions from the `@vectoricons.net/db` package. These are intended strictly for reference to inform the structure of Entity, Repository, and Service classes.
  - /schema.sql - The PostgreSQL schema dump file. DO NOT MODIFY THIS FILE. It is a read-only file that is updated manually.

⸻

### Note on `/refs/db-models` & Rules for Coding Agents

The `/refs/db-models` directory contains a read-only mirror of the Objection.js model definitions from the `@vectoricons.net/db` package. These are intended strictly for reference to inform the structure of Entity, Repository, and Service classes.

#### refs/db-models Purpose
- Enable Coding Agents to infer which columns, relations, and modifiers exist for each table.
- Allow Coding Agents to generate:
  - Proper Entity class member fields and accessors
  - Valid Repository queries with correct columns and joins
  - Optimized service logic with minimal overfetching

⸻

### Rules for Using `/refs/db-models`
- Do not import anything from `/refs/db-models` in production or test code.
- Do not modify files in `/refs/db-models`; they mirror the upstream DB repo.
- Use it only for reference purposes when writing Entity, Repository, or Service logic.
- Coding Agents may inspect model files to:
  - Determine available fields, relation mappings, and modifiers
  - Generate accurate query filters or joins in Repository methods
- Coding Agents may suggest improvements, but must not apply changes directly to files in this directory.

## Coding Agent Workflow and Output Rules

### Output Path

When the Coding Agents generates or modifies code:
- Output must be written to the appropriate folder under src/, matching the module name.
- Submodules (e.g., `account-types`) are considered part of their parent module (`accounts`) and should be nested accordingly.
- Coding Agents must always output code and tests directly into the appropriate location inside the src/ folder. Tests should be placed in a `__tests__` directory within each module or submodule. For example, tests for the `accounts` module should be in `src/accounts/__tests__/` and tests for the `account-types` submodule should be in `src/accounts/account-types/__tests__/`. Follow this structure exactly:
- 
```shell
src/<module-name>
src/<module-name>/__tests__/
src/<module-name>/<submodule>/
src/<module-name>/<submodule>/__tests__/
```

### Module & Submodule Awareness

- A module corresponds to a top-level directory under src/, such as:
- src/accounts/
- src/users/
- src/orders/
- A submodule is a child folder nested inside a module. For example:
- src/accounts/account-types/
- src/users/user-roles/
- src/orders/order-items/
- Coding Agents must treat each submodule as part of its parent module, and place files accordingly.
- When running a task, for example `accounts`, Coding Agents should assume any submodules (e.g., `account-types`) are part of the same task and should be included in the output.
- Coding Agents should assume unit test generation is part of the task and should generate tests in the appropriate `__tests__` directory for each module or submodule as part of the task.

### Folder Tree Consistency

Coding Agents must never reorganize, rename, or restructure the folder tree under src/. The current structure is considered immutable and must be mirrored exactly.
 
🛑 For example, if you’re modifying account-types, do not write to accounts/index.test.js or duplicate files. Output only to:

```shell
src/accounts/account-types/
src/accounts/account-types/__tests__/
```

⸻

#### 🔐 The `src/` Folder Tree is Canonical

Coding Agents must treat the `src/` folder structure as canonical and immutable.

This is the exact folder tree Coding Agents must replicate inside `./generated/`:

```
src
├── __tests__
├── accounts
│   ├── __tests__
│   └── account-types
│       └── __tests__
├── auth
│   └── login-history
├── aws
│   ├── s3
│   └── sqs
├── carts
│   ├── __tests__
│   └── cart-items
├── cashout-requests
│   └── __tests__
├── common
│   ├── banned-words
│   └── traits
├── config
├── coupon-codes
│   ├── __tests__
│   └── validators
├── credits
│   └── __tests__
├── db
│   └── __tests__
├── downloads
├── email-histories
├── event-histories
├── favorites
├── images
│   ├── image-processors
│   ├── image-types
│   └── previews
├── licenses
├── orders
│   ├── __tests__
│   └── order-items
├── products
│   ├── categories
│   ├── families
│   ├── icons
│   ├── illustrations
│   ├── sets
│   ├── subscriptions
│   │   └── subscription-plans
│   └── tags
├── purchased-items
├── search
├── stripe
│   ├── invoices
│   ├── stripe-customers
│   └── stripe-events
├── transactions
│   ├── __tests__
│   ├── payment-types
│   ├── transaction-categories
│   ├── transaction-items
│   └── transaction-types
├── users
│   ├── contributor-details
│   ├── user-addresses
│   ├── user-roles
│   ├── user-to-roles
│   ├── users-to-emails
│   ├── users-to-socials
│   └── users-to-subscription-plans
└── utils
```

### NOTE: The following folders are NOT modules and should not have the SOA pattern applied to them:
- `/aws` - Contains AWS service integrations, not SOA modules.
- `/common` - Contains shared utilities and traits, not SOA modules.
- `/config` - Configuration files, not SOA modules.
- `/db` - Contains database utilities, not SOA modules.
- `/utils` - Contains general utility functions, not SOA modules.

⸻

## Precedence Rules

Instructions in more-deeply-nested `AGENTS.md` files or direct system/developer/user instructions take precedence over general `AGENTS.md` instructions in case of conflicts.

## Pull Request Guidelines for Coding Agents

When a Coding Agent helps create a PR, please ensure it:

- Name the PR branch with a descriptive name that reflects the changes made.
- Prefix the branch name with `Coding Agents/` to indicate it was generated by Coding Agents.
- Includes a clear description of the changes as guided by AGENTS.md
- References any related issues that Coding Agents is addressing
- Ensures all tests pass for code generated by Coding Agents
- Keeps PRs focused on a single concern as specified in AGENTS.md
- Create PRs to target back to the original source branch
- NEVER use the names "main", "Master", or "develop" in branch names.
- NEVER target `main` branch for PRs. Always target the original source branch.
- Prefix branch names with "Coding Agents/" to indicate they are generated by Coding Agents.
- Prefix commits with  `chore:`, `feat:`, or `fix:` following the commitlint format (commitlint is not installed but I want to follow this practice in case I decide to install it someday).
- Create a new PR with a descriptive name
   - Example: "Add CartItemEntity and CartItemRepository"
   - Avoid generic names like "Update files"
- Target the original source branch for PRs
1. Includes a checklist of changes made by Coding Agents, such as:
   - [ ] Added new feature X
   - [ ] Fixed bug Y
   - [ ] Updated documentation

### Pull Request Format

Coding Agents must always open a pull request with the following properties:

- **Target branch**: Must be the branch from which the Coding Agent task was launched.
- **Branch name**: Descriptive, prefixed with `<agent-name>/`, e.g., `<agent-name>/add-login-history-tests` (example: `Coding Agents/add-login-history-tests`)
- **Title**: Short but descriptive, e.g., `feat: add login-history tests`
- **Body**: Include a list of the key changes. Example:

    ```
    This PR adds tests for the login-history module.

    - Added unit tests for LoginHistoryService
    - Created mock repository for test isolation
    - Verified edge cases and error conditions
    ```

⸻

## Code to never change
The following files and directories are considered immutable and must never be modified, deleted, or altered in any way by Coding Agents:

- /refs - Reference files for the project. Coding Agents should not modify these files.
  - /db-models - Read-only mirror of the Objection.js model definitions from the `@vectoricons.net/db` package. These are intended strictly for reference to inform the structure of Entity, Repository, and Service classes.
  - /schema.sql - The PostgreSQL schema dump file. DO NOT MODIFY THIS FILE. It is a read-only file that is updated manually.
- /src/__tests__/* - Global tests like smoke test. Does not include module-specific unit tests
- /src/accounts/* - The Accounts module is considered stable and must not be modified unless explicitly instructed in a task.
- /src/banned-words/* - The Banned Words module is considered stable and must not be modified unless explicitly instructed in a task.


## IMPORTANT: Write the tests to test the code. Do not write the code to pass the tests.
It is commnon for developers to write code that is designed to pass the tests, rather than writing tests that validate the code. This can lead to tests that are not effective at catching bugs or edge cases. Coding Agents must always write tests that validate the code, rather than writing code that is designed to pass the tests.

---

## Respecting Existing Code

Coding Agents must treat existing code as a source of intent and design constraints, not as an unchangeable artifact. If the existing code is in conflict with the task requirements, Coding Agents should ignore the existing code and implement the task requirements in adherence to the project conventions outlined in `AGENTS.md`.

- You may refactor, optimize, or modify existing code if doing so improves clarity, correctness, or consistency with project goals.
- You should **preserve the original intent** of the module/existing code but not necessarily the exact implementation details.
- Do not delete or radically restructure code unless the task explicitly requires it.
- When in doubt, make changes additive and leave inline comments explaining your reasoning.

⸻

## General Conventions for AGENTS.md Implementation

- DO NOT take destructive actions such as deleting files, `git reset --hard`, or any other action that modifies or destroys resources that cannot be recovered or undone. Only take destructive actions if explicitly instructed to do so.
- DO NOT write to the root directory of the project. All code must be written to the `src/` directory, under the appropriate module or submodule which matches the task name.
- DO NOT change ownership of AWS resources when importing resources created by another stack.
- In all situations where an action has multiple options, choose the action that is least destructive and most reversible.
- Always take the most conservative action possible.
- Avoid introducing new libraries, helpers, or patterns unless explicitly instructed to refactor or modernize.
- Always choose the simplest solution that meets the requirements or solves the problem.
- Do not make unwarranted assumptions about the codebase or the project. If you are unsure about something, ask for clarification.
- Specific task instructions (e.g., in `tasks/favorites.md`) define the scope, constraints, and specific implementation details for that task. Refer to AGENTS.md for general guidelines, but follow task-specific instructions closely for implementation. In case of conflict, task instructions take precedence over AGENTS.md.
- Task files (e.g., `tasks/favorites.md`) may provide additional rules and restrictions that are not present in AGENTS.md. Always refer to the task file for specific instructions related to that task.
- Write Unit tests for all new code and ensure they pass.
- Add jSDoc comments to all public methods and classes.
- Add comments for complex logic as guided by AGENTS.md
- DO NOT use tabs for indentation (use 4 spaces)
- Queries involving joins or eager loading must use .withGraphFetched() or .modifiers and ensure type safety via Entity wrapping.
- Repositories may expose a raw() method for direct Objection.js queries, but this must be documented and used sparingly.
- Services orchestrate calls between Repositories, Entities, and other Services — but should never manually construct raw DB queries.
- Services may mutate Entities using helper methods but should always return new instances to preserve immutability.

⸻

### Testing Requirements for Coding Agents

See `TEST-STRATEGY.md` for an overview of the testing strategy.

Coding Agents should create unit tests AND integration tests for all code it generates. For the unit tests, it is fine to use Mocks, however, for integration tests, DO NOT USE mocks. We are using a dockerized PostgreSQL database with a copy of the live site data for integration test purposes. Coding Agents should use this database to run integration tests against real data. Refer to `src/accounts/__tests__/service.test.js` for an example of how to write integration tests that use the real database. For examples of unit tests that use mocks, refer to `src/cashout-requests/__tests__/service.unit.test.js` and `src/cashout-requests/__tests__/repository.unit.test.js`.

Coding Agents should run tests with the following commands:

```bash
# Run all tests with Coding Agents
npm run test path/to/__tests__/

# Example:
npm run test src/accounts/__tests__/*.test.js

# Run specific test file with Coding Agents
npm run test path/to/test-file.test.js

# Example:
npm run test src/accounts/__tests__/AccountEntity.test.js

# Coverage
npm run test -- --coverage --collectCoverageFrom=src/accounts/**/*.js
```

The NPM script includes relevant options for the test commands.

### Test Contracts

See the section named `### Understanding Test Contracts` in `ARCHITECTURE.md` for an overview of the test contracts and how to use them. The test contracts are located in `src/__tests__/contracts/`. They provide a standardized way to test common behaviors across different modules. Coding Agents should prefer use of the contracts over writing custom tests for common behaviors. This ensures consistency and reduces duplication. If a given test case is covered by the contracts, Coding Agents DO NOT need to write a custom test for it. 

### Capability detection (what should be tested)

Before writing tests, perform a **pre‑flight scan**:

1. **Service capabilities**  
   - Instantiate the service via its `init` (e.g., `initCreditsService()`).  
   - Detect features by runtime method checks:
     ```js
     const svc = init<Module>Service();
     const supports = {
         softDelete  : typeof svc.softDelete   === 'function',
         activate    : typeof svc.activate     === 'function',
         deactivate  : typeof svc.deactivate   === 'function',
         toggleActive: typeof svc.toggleActive === 'function',
         // add others as needed (cache, plugins, observables...)
     };
     ```
    - The code is the single source of truth. READ THE CODE, don't guess and don't assume.

2. **Graph/eager relations**  
   - Read the Objection model for the module (e.g., `ModelClass.relationMappings`).  
   - Build a **graph allow‑list** from its relation keys (e.g., `['user', 'account', 'roles']`).  
   - Use repository/service helpers like `findOneWithRelations(where, '[relation]')`.  
     Assert the call resolves and returns the relation data if present. Don’t assume exact shapes beyond what the model guarantees.

3. **Entity fields and exposure**  
   - Read the Entity definition. If it uses `allowedColumns`/`hiddenFields`, assert they’re respected by `toJSON()` — **don’t** snapshot secrets; simply verify they’re absent.

## File structure to produce (module example)

- `./src/<module>/__tests__/entity.test.js`  
  Construct entity, `toJSON()` respects allowed/hidden, round‑trip basic fields.  
  Import and call `entity.contract.js` if applicable/permitted by its API.

- `./src/<module>/__tests__/repository.test.js`  
  Full transactional CRUD via repository (`{ trx }` everywhere).  
  Use relation graph(s) derived from the model’s `relationMappings`.  
  Validate payloads with schema if present (optional; tests must still pass without AJV).

- `./src/<module>/__tests__/service.test.js`  
  Full transactional CRUD via service (`init<Module>Service()`).  
  Conditional/skip mixin tests based on `supports.*` detection above.  
  Relations via service equivalents if provided.

- `./src/<module>/__tests__/pluggable.test.js`  
  Only if the service exposes pluggable APIs. Otherwise `test.skip`.

## Write–Run–Fix loop (enforced)

After writing/altering tests:

1. Run:
   ```bash
   npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/<module>/__tests__/*.test.js
   ```
2. If failures occur, **edit tests only** to fix adapter signatures, method names, or relation keys — do **not** copy contract code.
3. Re‑run until green (or report blockers with the exact failing assertion and the code location you inspected).

## Safety constraints

- **Transactions**: wrap DB changes in a per‑test transaction and roll them back in `afterEach`. Only delete data you created.
- **Existing users**: when needed, use `user_id = 1` (admin) as per project rules.
- **Backups**: before modifying an existing test file, write `file.bak.js` (or timestamped variant if already exists).

⸻

## NOTES:

There may be some legacy code in the project that does not follow the current conventions or structure. Coding Agents should not use this legacy code as a reference for new code. Instead, Coding Agents should follow the current conventions and structure outlined in this `AGENTS.md` file.

The `src/accounts` and `src/accounts/account-types` directories are the closest to the current design and can be used as a reference for implementing new modules.

- Any references to ModelsRegistry should be ignored. This is legacy code and is being replaced.
- Any references to @vectopus.com/db are WRONG. The correct DB import is @vectoricons.net/db. If you encounter `@vectopus.com/db`, replace it with `@vectoricons.net/db`.
- Any references to src/entities, src/repositories, or src/services should be ignored. These are legacy directories and should not be used. All new code should be placed in the appropriate module or submodule under src/ (ie, src/$moduleName and src/<module-name>/<sub-module-name>).