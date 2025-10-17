IMPORTANT!: Instructions in this file override any conflicting instructions in the root README.md or AGENTS.md.

# Task: Rewrite accounts.plugin.js to use factory.js (match accounts.plugin.js)

## Goal
Refactor `./http/src/plugins/accounts.plugin.js` to match the style and structure of `./http/src/plugins/accounts.plugin.js`, using the CRUD route factories from `./http/src/factory.js`. Keep comments on each route (purpose, inputs, outputs). Use the schemas from `./http/src/schemas/accounts.js`. Do not inline schemas.

## Absolute constraints
- Modify **only** `./http/src/plugins/accounts.plugin.js`.
- Do **not** open or read any file except the list under “Files you may open”.
- Do **not** create new files.
- Indentation is **4 spaces** everywhere.
- Keep imports, naming, and route comments consistent with `accounts.plugin.js`.

## Files you may open (and only these)
1. `./http/src/plugins/accounts.plugin.js`        (target to rewrite)  
2. `./http/src/plugins/accounts.plugin.js`         (reference style)  
3. `./http/src/factory.js`                         (route factories: paginate, list, getItem, createItem, patchItem, deleteItem)  
4. `./http/src/schemas/accounts.js`              (schemas for this module)  
5. `./src/accounts/index.js`                     (service initializer & entity class export)  
6. `./src/accounts/{{Module}}Entity.js`          (entity class if referenced by index.js)  

> Do not open any other files (no docs, no unrelated modules, no tests, no root configs).

## Implementation notes
- Import:
    ```js
    const { init{{Module}}Service, {{Module}}Entity } = require('../../src/accounts');
    const { paginate, list, getItem, createItem, patchItem, deleteItem } = require('../factory');
    const schemas = require('../schemas/accounts');
    ```
- Create `service = init{{Module}}Service();`
- Create a `baseConfig = { service, entityClass: {{Module}}Entity, baseWhere: {} }`
- Register the same set of routes used in `accounts.plugin.js` via the factories, matching that file’s comments and structure (adapt path prefix to `module.exports.prefix` for this plugin).
- Use `getWhere(req)` on list routes to read query filters owned by this module (keep logic simple).
- Do **not** inline or redefine schemas. Import them from `./http/src/schemas/accounts.js`.
- Preserve/emit route comments explaining method, path, inputs (params/query/body), and outputs.

## Output format
Return the full contents of the rewritten `./http/src/plugins/accounts.plugin.js`, nothing else.