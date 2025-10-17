# Users-to-Socials Tests

## Objective
Create comprehensive tests for the users-to-socials submodule (social media account links) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/users-to-socials-tests`
- [x] Analyze UserToSocials module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/users-to-socials/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for UserToSocialsEntity
- [ ] Write `repository.test.js` - Tests for UserToSocialsRepository
- [ ] Write `service.test.js` - Tests for UserToSocialsService (contract + custom tests)

### 3. Module Analysis

**Entity Details:**
- **Entity**: UserToSocialsEntity
- **Fields** (6 total):
  - id, user_id (required)
  - label (e.g., "Twitter", "GitHub", "LinkedIn")
  - url (social media profile URL)
  - created_at, updated_at
- **Relations**: user (UserEntity)
- **Purpose**: Track user's social media account links

**Repository:**
- **Repository**: UserToSocialsRepository (extends BaseRepository)
- **Model Name**: 'usersToSocial'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: UserToSocialsService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Database Schema:**
- **Indices**:
  - Primary key on `id`
  - Index on `url` (for lookups)
  - Index on `user_id` (for user queries)
- **No unique constraints** on url or (user_id, label) combination
- **All fields nullable** except id, created_at, updated_at

**Test Data Strategy:**
- Junction table for user social media links
- Use valid social media URLs (Twitter, GitHub, LinkedIn, etc.)
- Pattern: Create user via UserService → Create social links for user
- Test multiple social accounts per user
- URL validation: Basic URL format checking
- Label examples: "Twitter", "GitHub", "LinkedIn", "Facebook", "Instagram"

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods
- `whereForUnique: (data) => ({ id: data.id })` - No natural unique key (use id)
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping (snake_case → camelCase) for all 6 fields
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation materialization with user

**Repository Tests:**
- Standard CRUD operations via contract
- Create test users via UserService (SOA compliance)
- Verify correct model wiring (usersToSocial)
- Test indexed queries (by user_id, by url)

**Service Tests - Contract:**
- Standard service operations via contract
- Create test users via UserService (SOA compliance)

**Service Tests - Custom (Social Media Management):**

1. **Multiple Social Accounts:**
   - Test user with multiple social media accounts
   - Test different platforms (Twitter, GitHub, LinkedIn)
   - Test querying all social accounts for a user
   - Test updating/removing social accounts

2. **URL Validation:**
   - Test valid social media URLs:
     - Twitter: `https://twitter.com/username`
     - GitHub: `https://github.com/username`
     - LinkedIn: `https://linkedin.com/in/username`
     - Facebook: `https://facebook.com/username`
     - Instagram: `https://instagram.com/username`
   - Test that URLs are stored correctly
   - Test URL format variations (with/without https, trailing slashes)

3. **Label Management:**
   - Test common social media labels
   - Test custom labels
   - Test same label for different users (allowed)
   - Test multiple links with same label for one user (allowed)

4. **User Social Profile Queries:**
   - Test finding all socials for a user
   - Test finding specific social by label
   - Test finding social by URL

### 5. URL Validation Rules
- **Format**: Basic URL format (http:// or https://)
- **Common patterns**:
  - Twitter/X: `https://twitter.com/` or `https://x.com/`
  - GitHub: `https://github.com/`
  - LinkedIn: `https://linkedin.com/in/` or `https://www.linkedin.com/in/`
  - Facebook: `https://facebook.com/` or `https://www.facebook.com/`
  - Instagram: `https://instagram.com/` or `https://www.instagram.com/`
- **No uniqueness**: Same URL can be used by multiple users (verified accounts, shared pages)

### 6. Validation
- [ ] Run tests: `npm test -- src/users/users-to-socials/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly
- [ ] Verify URL and label handling works correctly

### 7. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Simple junction table for social media links
- Multiple socials per user allowed
- No uniqueness constraints (user can have multiple Twitter accounts, etc.)
- Focus on URL storage and retrieval
- Labels are freeform text (not enum)
- Follow SOA: Always use UserService to create test users
- Good example of simple many-to-one relationship
