# Contributor Details Tests

## Objective
Create comprehensive tests for the contributor-details submodule following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/contributor-details-tests`
- [x] Analyze ContributorDetail module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/contributor-details/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for ContributorDetailEntity
- [ ] Write `repository.test.js` - Tests for ContributorDetailRepository
- [ ] Write `service.test.js` - Tests for ContributorDetailService

### 3. Module Analysis

**Entity Details:**
- **Entity**: ContributorDetailEntity
- **Fields** (12 total):
  - id, user_id (required)
  - company_name, country
  - how_did_you_hear_about_us
  - intended_assets
  - looking_for_in_marketplace
  - links_to_other_markets
  - publications_interviews
  - asset_links
  - created_at, updated_at
- **Relations**: user (UserEntity)
- **Relationship**: One-to-one (one contributor detail per user)

**Repository:**
- **Repository**: ContributorDetailRepository (extends BaseRepository)
- **Model Name**: 'contributorDetails'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: ContributorDetailService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Test Data Strategy:**
- Simple entity with contributor-specific fields
- Use unique generated data to avoid conflicts
- Pattern: Create user via UserService → Create contributor details linked to user
- Test with comprehensive data (all fields populated)
- Use UserService to create test users (follow SOA architecture)
- **Security**: Ensure safe inputs, no buffer overflow, no injection attacks

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods
- `whereForUnique: (data) => ({ user_id: data.user_id })` - One-to-one relationship
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping (snake_case → camelCase) for all 12 fields
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation materialization with user (need makeRelations function)

**Repository Tests:**
- Standard CRUD operations via contract
- Create test users via UserService (SOA compliance)
- Verify correct model wiring (contributorDetails)
- Test unique constraint on user_id (one-to-one)

**Service Tests:**
- Standard service operations via contract
- Create test users via UserService (SOA compliance)
- No custom methods to test

**Security Validation:**
- Use reasonable field lengths (no buffer overflow attempts)
- Safe string inputs (no injection patterns)
- Valid data formats for all fields

### 5. Validation
- [ ] Run tests: `npm test -- src/users/contributor-details/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly

### 6. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Simple standard module - no custom methods
- Focus on comprehensive field coverage (12 fields)
- One-to-one relationship with users (unique on user_id)
- All fields are optional except user_id
- Follow SOA: Always use UserService to create test users
- Security: Use safe, reasonable test data
