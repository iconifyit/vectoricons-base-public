# Users-to-Emails Tests

## Objective
Create comprehensive tests for the users-to-emails submodule (email address management and history) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/users-to-emails-tests`
- [x] Analyze UsersToEmails module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/users-to-emails/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for UserToEmailsEntity
- [ ] Write `repository.test.js` - Tests for UserToEmailsRepository
- [ ] Write `service.test.js` - Tests for UserToEmailsService (contract + custom tests)

### 3. Module Analysis

**Entity Details:**
- **Entity**: UserToEmailsEntity
- **Fields** (10 total):
  - id, user_id
  - email (globally unique)
  - token, token_expires (email verification)
  - is_active, is_verified, verified_at
  - created_at, updated_at
- **Relations**: user (UserEntity)
- **Purpose**: Track email address changes and verification history per user

**Repository:**
- **Repository**: UserToEmailsRepository (extends BaseRepository)
- **Model Name**: 'usersToEmail'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: UserToEmailsService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Test Data Strategy:**
- Junction table for user email history
- Use unique, valid email addresses
- Pattern: Create user via UserService → Create email entries for user
- Test verification workflow (unverified → verified)
- Test email activation states
- **Email validation**: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods (uses is_active field)
- `whereForUnique: (data) => ({ email: data.email })` - Globally unique email
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping (snake_case → camelCase) for all 10 fields
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation materialization with user

**Repository Tests:**
- Standard CRUD operations via contract
- Create test users via UserService (SOA compliance)
- Verify correct model wiring (usersToEmail)
- Test unique constraint on email (globally unique)

**Service Tests - Contract:**
- Standard service operations via contract
- Create test users via UserService (SOA compliance)

**Service Tests - Custom (Email Management):**

1. **Email Verification Workflow:**
   - Create unverified email with verification token
   - Test token expiration (token_expires in past vs future)
   - Verify email (set is_verified=true, verified_at, clear token)

2. **Email Activation:**
   - Test activating/deactivating emails (is_active flag)
   - Test that multiple emails can exist for one user
   - Test email history tracking

3. **Email Validation:**
   - Test valid email formats:
     - Standard: `user@example.com`
     - With dots: `first.last@example.com`
     - With plus: `user+tag@example.com`
     - With numbers: `user123@example.com`
     - Subdomain: `user@mail.example.com`
   - Test invalid formats are rejected by validation
   - Test globally unique constraint (same email can't be used by different users)

4. **Email History:**
   - Test user with multiple email addresses over time
   - Test querying all emails for a user
   - Test finding active email for a user

### 5. Email Validation Rules
- **Format**: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- **Uniqueness**: Globally unique across all users
- **Security**: Tokens should be secure (random), expires should be future date
- **Verification**: Only verified emails should be activatable

### 6. Validation
- [ ] Run tests: `npm test -- src/users/users-to-emails/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly
- [ ] Verify email validation works correctly

### 7. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Email address change tracking and history
- Verification workflow with tokens
- Globally unique email addresses
- Multiple emails per user allowed (history)
- Follow SOA: Always use UserService to create test users
- Focus on email verification states and validation
- Good example of email management pattern
