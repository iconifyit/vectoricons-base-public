# User Addresses Tests

## Objective
Create comprehensive tests for the user-addresses submodule following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/user-addresses-tests`
- [x] Analyze UserAddress module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/user-addresses/__tests__/` directory
- [ ] Write `entity.test.js` - Tests for UserAddressEntity
- [ ] Write `repository.test.js` - Tests for UserAddressRepository
- [ ] Write `service.test.js` - Tests for UserAddressService

### 3. Module Analysis

**Entity Details:**
- **Entity**: UserAddressEntity
- **Fields** (14 total):
  - id, user_id (required)
  - address_line_1, address_line_2
  - city, country, province, postal_code
  - job, company_name, vat_number, website
  - created_at, updated_at
- **Relations**: user (UserEntity)

**Repository:**
- **Repository**: UserAddressRepository (extends BaseRepository)
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: UserAddressService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Test Data Strategy:**
- Simple entity with address fields
- Use unique generated data to avoid conflicts
- Pattern: Create user via UserService → Create address linked to user
- Test with comprehensive address data (all fields populated)
- Use UserService to create test users (follow SOA architecture)

**Contract Configuration:**
- `supportsSoftDelete: false` - No soft delete mixin
- `supportsActivation: false` - No activate/deactivate methods
- `whereForUnique: (data) => ({ user_id: data.user_id, address_line_1: data.address_line_1 })`
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping (snake_case → camelCase) for all 14 fields
- Verify all fields present in toJSON output
- Standard contract tests

**Repository Tests:**
- Standard CRUD operations via contract
- Create test users via UserService (SOA compliance)
- Verify correct model wiring (userAddress)
- Test unique constraint on user_id + address_line_1

**Service Tests:**
- Standard service operations via contract
- Create test users via UserService (SOA compliance)
- No custom methods to test

### 5. Validation
- [ ] Run tests: `npm test -- src/users/user-addresses/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly

### 6. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Simple standard module - no custom methods
- Focus on comprehensive field coverage (14 fields)
- All address fields are optional except user_id
- Follow SOA: Always use UserService to create test users
- Good example of one-to-many relationship (user has many addresses)
