# Task: Login History Module Tests

## Module Description
The `login-history` module tracks all login attempts (successful and failed) for security auditing and rate limiting purposes. It provides functionality to query login history by various criteria and count recent failed attempts for account lockout protection.

## Module Structure
- **Entity**: `LoginHistoryEntity` - Represents a login attempt record
- **Repository**: `LoginHistoryRepository` - Data access layer with custom query methods
- **Service**: `LoginHistoryService` - Business logic layer

## Key Tests to Implement

### Entity Tests (`entity.test.js` + `entity.unit.test.js`)

**Integration Tests (No Mocks):**
1. Field mapping between database (snake_case) and entity (camelCase)
2. Serialization/deserialization with toJSON()
3. Required field validation (email, status)
4. Enum validation for status field (SUCCESS/FAILED only)
5. Relation to UserEntity
6. Timestamp handling

**Unit Tests (With Mocks):**
1. Constructor initialization
2. Field accessor methods
3. AllowedColumns configuration
4. Hidden fields configuration (none expected)
5. Related entity resolution (mock UserEntity)

**Edge Cases:**
- Invalid status values (not SUCCESS or FAILED)
- Missing required fields (email, status)
- Null vs undefined for nullable fields (user_id, reason, token_version)
- Long strings exceeding maxLength

**Time Estimate:** 30 minutes

---

### Repository Tests (`repository.test.js` + `repository.unit.test.js`)

**Integration Tests (No Mocks):**
1. **Custom Methods:**
   - `resetLoginHistory(email)` - Delete all records for email
   - `countRecentFailedAttempts({userId, ipAddress, since})` - Count failed attempts
2. **BaseRepository Contract Tests:**
   - CRUD operations (create, findOne, findAll, update, delete)
   - Pagination
   - Count and exists methods
   - Entity wrapping on reads
3. **Transaction Support:**
   - All methods work within transactions
   - Rollback scenarios

**Unit Tests (With Mocks):**
1. Constructor initialization with mocked DB
2. Custom method logic with mocked queries
3. Error handling for query failures
4. Parameter validation (e.g., userId or ipAddress required)

**Edge Cases:**
- `countRecentFailedAttempts()` with neither userId nor ipAddress (should throw)
- `countRecentFailedAttempts()` with both userId and ipAddress
- Empty result sets
- Time-based queries (15-minute window)
- Reset login history for non-existent email

**Time Estimate:** 45 minutes

---

### Service Tests (`service.test.js` + `service.unit.test.js`)

**Integration Tests (No Mocks):**
1. **Custom Getter Methods:**
   - `getByUserId(userId)` - Returns all login attempts for user
   - `getByEmail(email)` - Returns all login attempts for email
   - `getByIpAddress(ipAddress)` - Returns all login attempts from IP
   - `getByStatus(status)` - Returns all SUCCESS or FAILED attempts
2. **Count Methods:**
   - `countByUserId(userId)` - Count total attempts for user
   - `countFailedAttempts({userId, ipAddress})` - Count recent failed attempts
3. **Utility Methods:**
   - `resetLoginHistory(email)` - Delegates to repository
4. **BaseService Contract Tests:**
   - CRUD operations delegation
   - Pagination
   - Entity wrapping

**Unit Tests (With Mocks):**
1. Constructor with mocked repository
2. Custom methods delegate to repository correctly
3. Parameters passed through correctly
4. Results returned correctly
5. Error propagation from repository

**Edge Cases:**
- Query by non-existent userId/email/IP
- Invalid status value
- countFailedAttempts with no recent attempts (returns 0)
- Transaction support in all methods

**Time Estimate:** 45 minutes

---

## Setup and Teardown

**Setup:**
1. Create seed helper in `seed.js` with factory functions:
   - `createLoginHistoryRecord(overrides)` - Create single record
   - `createSuccessfulLogin(userId, email)` - Shortcut for SUCCESS
   - `createFailedLogin(userId, email, reason)` - Shortcut for FAILED
   - `createRecentFailedAttempts(count, userId, ipAddress)` - Create multiple failed attempts
2. Use database transaction per test suite
3. Seed test users in users table (for foreign key constraints)

**Teardown:**
1. Rollback transaction after each test suite
2. Clean up any test data

**Dependencies to Mock (Unit Tests Only):**
- `LoginHistoryRepository` (for Service unit tests)
- `DB.loginHistory` model (for Repository unit tests)
- Related entities (UserEntity)

**No Mocks (Integration Tests):**
- Use real PostgreSQL database
- Use real repository and service instances
- Test actual SQL queries

---

## Time Estimates

| Task | Estimated Time |
|------|----------------|
| Seed data setup | 15 min |
| Entity tests (both) | 30 min |
| Repository tests (both) | 45 min |
| Service tests (both) | 45 min |
| Test execution & debugging | 15 min |
| **Total** | **~2.5 hours** |

---

## Checklist of Files

**To Create:**
- [ ] `src/auth/login-history/__tests__/seed.js`
- [ ] `src/auth/login-history/__tests__/entity.test.js`
- [ ] `src/auth/login-history/__tests__/entity.unit.test.js`
- [ ] `src/auth/login-history/__tests__/repository.test.js`
- [ ] `src/auth/login-history/__tests__/repository.unit.test.js`
- [ ] `src/auth/login-history/__tests__/service.test.js`
- [ ] `src/auth/login-history/__tests__/service.unit.test.js`

**To Modify:**
- [ ] `tests-checklist.md` - Mark `[ ] auth/login-history` as `[x] auth/login-history`

---

## Test Execution Commands

```bash
# Run all login-history tests
npm run test src/auth/login-history/__tests__/

# Run specific test files
npm run test src/auth/login-history/__tests__/entity.test.js
npm run test src/auth/login-history/__tests__/entity.unit.test.js
npm run test src/auth/login-history/__tests__/repository.test.js
npm run test src/auth/login-history/__tests__/repository.unit.test.js
npm run test src/auth/login-history/__tests__/service.test.js
npm run test src/auth/login-history/__tests__/service.unit.test.js

# Coverage
npm run test -- --coverage --collectCoverageFrom=src/auth/login-history/**/*.js
```

---

## Expected Test Coverage

- **Entity**: 100% (simple wrapper class)
- **Repository**: 90%+ (cover custom methods and base functionality)
- **Service**: 90%+ (cover custom methods and delegation)
- **Overall Module**: 90%+ coverage

---

## Notes

- Follow test contracts from `src/__tests__/contracts/` where applicable
- Use transaction rollback pattern to avoid database pollution
- Test both happy path and error conditions
- Ensure thread-safety with concurrent login attempts
- Validate time-based queries work correctly (15-minute window for failed attempts)
