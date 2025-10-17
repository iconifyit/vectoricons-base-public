# Integration Testing Strategy

This document outlines the strategy for testing the VectorIcons system using a persistent **production-like database copy**. The goal is to validate functionality across feature groups and services without relying on mocks or artificial seeds.

---

## Guiding Principles

- **No mocks**: All tests run against a real database clone to ensure relational fidelity.
- **Persistent DB**: The test database is long-lived, not torn down/rebuilt between runs.
- **Minimal Seeding**: Avoid complex fixtures. Instead, rely on live-like data relationships.
- **Observability**: Log test outcomes with sufficient context for debugging.
- **Safety**: Scrub sensitive PII and payment data in the copied DB.

---

## Test Levels

1. **System Tests**
   - Full end-to-end flows (signup → login → purchase → transaction → logout).
   - Validate services, DB, and API behavior together.

2. **Multi-Group Integration**
   - Covers flows spanning multiple feature groups (e.g., transactions + orders + carts).
   - Ensures cross-group dependencies function correctly.

3. **Feature Group Integration**
   - Each feature group = SOA classes + Fastify plugin + endpoints.
   - Example: Accounts group → `AccountService`, `AccountEntity`, `accounts.plugin.js`.

4. **Plugin Tests**
   - Test the Fastify plugin routes as a group.
   - Focus: schema validation, auth pre-handlers, response formatting.

5. **Endpoint Tests**
   - Exercise a single endpoint with valid/invalid inputs.
   - Confirm role-based restrictions and error handling.

6. **SOA Tests**
   - Validate SOA class contracts (`Service`, `Repository`, `Entity`).
   - Most already implemented; ensure consistency with group integration tests.

7. **Cross-Feature Scenarios**
   - Validate features like ACL, `DENY_ALL` role, or auth guards across endpoints.
   - Example: assign `DENY_ALL` → confirm all endpoints return 403.

---

## Database Strategy

- **Clone Production → Scrub Sensitive Data**
  - Test database is a Duplicate of the live DB schema/data.
  - Mask emails, replace payment tokens, anonymize PII.

- **Stable UUID Fixtures**
  - Maintain a reference list of canonical UUIDs/IDs for tests:
    - Test Admin user
    - Test Contributor with sets/icons
    - Test Customer with subscriptions

---

## Risks & Mitigations

- **DB Drift**
  - New snapshot may change IDs/UUIDs.
  - Mitigation: maintain a `fixtures_map` table of stable references.

- **Sensitive Data**
  - Copying prod always risky.
  - Mitigation: scrub data before test use.

- **Coupling to Real Data**
  - Tests may fail if assumptions about relationships change.
  - Mitigation: accept failures as valid signals of potential prod issues.
  
## Test users

- admin:
    uuid: "0b6c8629-e10d-457f-b078-fd3261f80661"
    id: 1
    email: "scott@atomiclotus.net"
- contributor:
    uuid: "d1ff77c5-b424-46bc-b61f-646bd76ff10e"
    id: 94
    email: "lewiscot+google@gmail.com"
- customer:
    uuid: "ce8efd22-82bc-491e-967d-d5c2a92735e6"
    id: 2722
    email: "lewiscot+99@gmail.com"


## Test Creation Workflow

1. Checkout the develop branch and pull the latest updates
2. Create a new working branch with the naming pattern claude/<module-name>-tests
3. Verify that the schema, model, and entity are all consistent
4. Explain your plan (not save it to a file) for how you will test the module, then 
write a task file to ./tasks/<module-name>-tests.md (the task file should be essentially a prompt for coding agents including yourself). The task file should include:
   - A brief description of the module being tested
   - A list of the key tests that need to be implemented, including any edge cases or error conditions
   - Any specific setup or teardown steps required for the tests
   - Any dependencies on other modules or services that need to be mocked or stubbed
   - A rough estimate of how long each test will take to implement
   - A checklist of the files that will be created/modified (seed.js, entity.test.js, repository.test.js, service.test.js)
5. THEN proceed with implementation once I have said "Ok"
6. Commit early and often
7. Once the tests pass, run `git status` to pick up all changes
8. Create the PR
