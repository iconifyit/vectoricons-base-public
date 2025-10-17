IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Create unit tests for the credits module.

## Goal
Add or modify tests in `./src/credits/__tests__/*` to match the style and structure of existing tests in `./src/accounts/__tests__/*`, using Jest. Ensure full CRUD coverage (create/read/update/delete), edge cases, error handling, **and** eager-loading of relations via graph fetch.

## Workflow (MUST FOLLOW)

1. Make only the allowed changes listed in **Writable**.
2. After writing or editing tests, **run**:
```javascript
npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/credits/__tests__/*.test.js
```
3. If tests fail, read the error output, make minimal fixes, and **run the tests again**.
4. **Repeat** until the command exits with code 0 (all tests passing).
5. Append the latest test output to `./tasks-tmp/credits-jest.txt` on each run.
6. Do not finish the task until all tests pass.

Run tests with:
npx jest --noStackTrace --runInBand --verbose --detectOpenHandles --forceExit -- ./src/credits/__tests__/*.test.js

## Files you may open (read-only unless noted)
- ./AGENTS.md
- ./TEST-STRATEGY.md
- ./src/credits/AccountEntity.js (READ)
- ./src/credits/CreditEntity.js (READ)
- ./src/credits/CreditRepository.js (READ)
- ./src/credits/CreditService.js (READ)
- ./src/credits/index.js (READ; for init function)
- ./src/common/BaseEntity.js (READ)
- ./src/common/BaseRepository.js (READ)
- ./http/src/schemas/credits.js (READ; optional if present)
- ./src/__tests__/contracts/* (READ; optional — see “Contracts” below)

**Writable:**
- ./src/credits/__tests__/*.test.js (new or updated tests only)

## Absolute constraints
- JavaScript (ES6), CommonJS (`require`, `module.exports`), 4-space indent.
- Use async/await.
- **No mocks.** The DB is a live clone in Docker.
- Never delete existing data. Only delete rows you create.
- Use transactions (`const trx = await DB.knex.transaction()` in `beforeEach`; `await trx.rollback()` in `afterEach`).
- For tests needing an existing user, use user ID = 1 (admin).
- Use HTTP schemas from `./http/src/schemas/credits.js` for **input validation if present** (tests must still pass if schema/AJV is absent).
- Follow the structure and tone of `./src/accounts/__tests__/*`.
- Include CRUD, edge cases, error handling, and a relations test.

## What to implement
Create these files under `./src/credits/__tests__/`:
- `entity.test.js` — construct entity, `toJSON()`, filtering (allowed/hidden) doesn’t throw.
- `repository.test.js` — transactional CRUD via repository; if schema present + AJV available, validate input payload before create. Test eager load with:
  - `findOneWithRelations(where, graph)` or `withRelations(where, graph)`, trying graphs from a small allowlist (e.g., `[user]`, `[users]`, `[account]`) and asserting the call succeeds without assuming a specific relation name.
- `service.test.js` — transactional CRUD via service (`initCreditsService` or `initCreditService`), then `getOneWithRelations(where, graph)` like above.
- `pluggable.test.js` — **conditional** tests for mixin methods:
  - If the service exposes `softDelete`, test it; otherwise `test.skip`.
  - If the service exposes `activate`, `deactivate`, `toggleActive`, test them; otherwise `test.skip`.

## Contracts
Contracts exist under `./src/__tests__/contracts/*`. For this task you may **read** them for style, but do not import or run them unless explicitly instructed in a future task.

## Backups when changing existing tests
Before altering an existing test file, create a `.bak.js`. If a `.bak.js` exists, add a timestamp suffix (e.g., `file-name.bak-YYYYMMDD-HHmmss.js`).

## Notes / patterns to follow
- Payload builder: derive required fields from the repository model’s `jsonSchema.properties`, using sensible defaults, and always set `user_id = 1` if present.
- Transactions: always pass `{ trx }` through repository/service calls that accept it.
- Relations: use repository `withRelations`/`findOneWithRelations` (or service equivalents). Try a small, safe graph allowlist and assert success without depending on a specific relation name.