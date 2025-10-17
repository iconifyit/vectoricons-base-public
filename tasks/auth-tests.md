# Test Implementation: auth Module

## Module Overview

The `auth` module is an **orchestration service** that handles authentication flows by delegating to UserService and LoginHistoryService. Unlike typical CRUD modules, it has no database table and doesn't follow the full SOA pattern (Entity/Repository/Service).

**Key Components:**
- `AuthService.js` - Main orchestration service
- `AuthErrors.js` - Custom error classes
- `login-history/` - Sub-module with full SOA implementation (tested separately)

## Code Cleanup Required

### Files to Remove
1. **AuthEntity.js** - Empty stub, never used, no domain object to represent
2. **AuthRepository.js** - Incorrectly configured (points to loginHistory model), never instantiated

**Rationale:** AuthService works correctly as an orchestration service without these files. There is no `auth` database table, and both UserService and LoginHistoryService already have proper repositories.

## Test Strategy

Since auth has no database model, we **skip the standard entity/repository/service contract tests**. Instead, we implement:

### 1. Service Integration Tests (`service.test.js`)
Test AuthService methods against the **real database** with actual UserService and LoginHistoryService dependencies. This validates the orchestration logic and real behavior.

### 2. Unit Tests (`unit.test.js`) - Optional
Test pure functions and JWT operations in isolation without database dependencies.

## Test Coverage Plan

### Service Integration Tests (Priority: HIGH)

**Test Group: Password Management**
- Hash password with bcrypt (verify hash format)
- Validate password against hash (correct password)
- Validate password against hash (incorrect password)
- Check password complexity validation (valid passwords)
- Check password complexity validation (invalid passwords: too short, no uppercase, no special char, etc.)

**Test Group: User Registration**
- Register new user with valid data
- Register assigns ROLE_CUSTOMER by default
- Register with duplicate email throws error
- Register creates unverified user (is_verified = false)
- Register transaction rollback on failure

**Test Group: User Lookup & Validation**
- Get user by email (active, verified user)
- Get user by email returns null (inactive user)
- Get user by email returns null (deleted user)
- Get user by email returns null (unverified user)
- Get user by email returns null (non-existent email)

**Test Group: Login Attempt Tracking**
- Count failed attempts by user_id
- Count failed attempts by ip_address
- Check if exceeded attempts threshold (below limit)
- Check if exceeded attempts threshold (at limit)
- Check if exceeded attempts threshold (above limit)
- Record successful login attempt
- Record failed login attempt with reason

**Test Group: Token Management - User JWT**
- Sign user token with payload
- Verify valid user token
- Verify expired token throws error
- Verify tampered token throws error
- Token includes default 15m expiration
- Can override token expiration options

**Test Group: Token Management - Client Signatures**
- Create client signature with clientId
- Verify client signature with trusted client
- Verify client signature fails for untrusted client
- Client signature includes nonce
- Client signature respects TTL (default 30s)
- Client signature can use custom secret

**Test Group: Token Version Management (Logout)**
- Increment token version for user (logout)
- Multiple logout calls increment sequentially
- Token version used to invalidate old JWTs

**Test Group: Password Reset Flow**
- Start password reset generates token
- Start password reset updates user record
- Start password reset sets expiration (15 minutes)
- Reset password with valid token
- Reset password hashes new password
- Reset password increments token version
- Reset password clears reset token/expiration

**Test Group: Email Verification**
- Generate email verification token for unverified user
- Verification token contains uuid and email
- Verification token expires after 15 minutes
- Validate verification token sets is_verified = true
- Validate verification token sets verified_at timestamp
- Validate expired token throws error
- Validate token for already-verified user throws error
- Validate token for deleted user throws error
- Validate token for non-existent user throws error

**Test Group: User Deactivation**
- Deactivate user soft-deletes user record
- Deactivate non-existent user throws error
- Deactivate uses transaction (rollback on error)

**Test Group: Duplicate Email Check**
- isDuplicateEmail returns true for existing email
- isDuplicateEmail returns false for new email
- isDuplicateEmail is case-insensitive

### Unit Tests (Priority: MEDIUM)

**Test Group: Pure Utility Functions**
- `createResetToken()` generates 64-char hex string
- `createResetToken()` generates unique tokens
- `isValidPassword()` validates against regex
- `isValidPassword()` edge cases (special characters, unicode)

**Test Group: Error Classes**
- `InvalidCredentialsError` with attempts remaining
- `InvalidCredentialsError` without attempts remaining
- `TooManyAttemptsError` message and code
- `InvalidResetTokenError` message and code

## Test Data & Fixtures

### Test Users (from TEST-STRATEGY.md)
```javascript
const TEST_USERS = {
    admin: {
        uuid: "0b6c8629-e10d-457f-b078-fd3261f80661",
        id: 1,
        email: "scott@atomiclotus.net"
    },
    contributor: {
        uuid: "d1ff77c5-b424-46bc-b61f-646bd76ff10e",
        id: 94,
        email: "lewiscot+google@gmail.com"
    },
    customer: {
        uuid: "ce8efd22-82bc-491e-967d-d5c2a92735e6",
        id: 2722,
        email: "lewiscot+99@gmail.com"
    }
};
```

### Test Passwords
```javascript
const VALID_PASSWORD = "Test123!@#";
const INVALID_PASSWORDS = {
    tooShort: "Test1!",
    noUppercase: "test123!@#",
    noLowercase: "TEST123!@#",
    noNumber: "TestTest!@#",
    noSpecial: "Test123456"
};
```

### JWT Secrets
Use `process.env.JWT_SECRET` and `process.env.PLATFORM_SECRET` from environment.

## Implementation Notes

### Database Considerations
- Tests run against **real production-like database**
- Use existing test users (admin, contributor, customer)
- Clean up any created test data in afterEach/afterAll
- Login history records will accumulate (acceptable)

### Transaction Handling
- Test that transactions rollback on errors (register, resetPassword, deactivateUser)
- Verify data consistency after rollbacks

### Error Handling
- Validate error messages and codes
- Test both thrown errors and null returns
- Verify security: don't leak sensitive info in error messages

### JWT Testing
- Mock/control time for expiration tests (may need jest.useFakeTimers)
- Verify token payload structure
- Test signature verification with different secrets

### Performance
- Integration tests should complete in <5 seconds total
- No need to disable any tests (unlike search-activity)

## Estimated Implementation Time

- **Code Cleanup (remove files):** 5 minutes
- **Service Integration Tests:** 45-60 minutes
  - Password management: 10 min
  - User registration: 10 min
  - Login attempt tracking: 10 min
  - Token management: 15 min
  - Password reset: 10 min
  - Email verification: 10 min
  - Misc (deactivation, duplicate check): 5 min
- **Unit Tests (optional):** 15 minutes
- **Total:** 60-80 minutes

## Files to Create/Modify

### Create
- [ ] `src/auth/__tests__/service.test.js` - Integration tests for AuthService
- [ ] `src/auth/__tests__/unit.test.js` - Unit tests for pure functions (optional)
- [ ] `tasks/auth-tests.md` - This file (documentation)

### Modify
- [ ] `tests-checklist.md` - Mark `auth` as complete

### Delete
- [ ] `src/auth/AuthEntity.js`
- [ ] `src/auth/AuthRepository.js`

## Success Criteria

- [ ] AuthEntity.js and AuthRepository.js removed
- [ ] All service integration tests passing
- [ ] Test coverage for all major AuthService methods
- [ ] Tests validate orchestration with real UserService/LoginHistoryService
- [ ] Error cases handled properly
- [ ] Transaction rollbacks verified
- [ ] JWT signing/verification tested
- [ ] Tests complete in reasonable time (<5 seconds)
- [ ] tests-checklist.md updated
