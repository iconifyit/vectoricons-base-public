# Users-to-Subscription-Plans Tests

## Objective
Create comprehensive tests for the users-to-subscription-plans submodule (user subscription management) following established SOA testing patterns.

## Plan

### 1. Branch Setup
- [x] Create new branch `claude/users-to-subscription-plans-tests`
- [x] Analyze UserToSubscriptionPlan module structure
- [x] Write this task file

### 2. Test Structure
- [ ] Create `src/users/users-to-subscription-plans/__tests__/` directory (already exists but empty)
- [ ] Write `entity.test.js` - Tests for UserToSubscriptionPlanEntity
- [ ] Write `repository.test.js` - Tests for UserToSubscriptionPlanRepository
- [ ] Write `service.test.js` - Tests for UserToSubscriptionPlanService (contract + custom tests)

### 3. Module Analysis

**Entity Details:**
- **Entity**: UserToSubscriptionPlanEntity
- **Fields** (11 total):
  - id, user_id, subscription_plan_id (required)
  - stripe_subscription_plan_id (Stripe integration)
  - start_date, end_date (subscription period)
  - price_per_credit (pricing)
  - is_active (activation state)
  - is_deleted (soft delete)
  - created_at, updated_at
- **Relations**:
  - user (UserEntity)
  - subscriptionPlan (SubscriptionPlanEntity)
- **Purpose**: Track user subscription plans with dates, pricing, and Stripe integration

**Repository:**
- **Repository**: UserToSubscriptionPlanRepository (extends BaseRepository)
- **Model Name**: 'usersToSubscriptionPlan'
- **Custom Methods**: None (pure BaseRepository)

**Service:**
- **Service**: UserToSubscriptionPlanService (extends BaseService)
- **Dependencies**: None
- **Custom Methods**: None (pure BaseService)

**Test Data Strategy:**
- Junction table for user subscriptions
- Pattern: Create user via UserService → Create subscription plan → Link via UserToSubscriptionPlanService
- Test subscription lifecycle (start, active, expired, cancelled)
- Test soft delete (is_deleted field)
- Date validation (start_date <= end_date)
- Price handling (price_per_credit as decimal)

**Contract Configuration:**
- `supportsSoftDelete: true` - Has is_deleted field
- `supportsActivation: true` - Has is_active field
- `whereForUnique: (data) => ({ user_id: data.user_id, subscription_plan_id: data.subscription_plan_id })` - Composite key
- `supportsRelations: false` - Skip relation testing (no DB model access)

### 4. Test Coverage

**Entity Tests:**
- Field mapping (snake_case → camelCase) for all 11 fields
- Verify all fields present in toJSON output
- Standard contract tests
- Test relation materialization with user and subscriptionPlan

**Repository Tests:**
- Standard CRUD operations via contract
- Create test users via UserService (SOA compliance)
- Test soft delete functionality
- Verify correct model wiring (usersToSubscriptionPlan)

**Service Tests - Contract:**
- Standard service operations via contract
- Create test users via UserService (SOA compliance)
- Soft delete tests
- Activation/deactivation tests

**Service Tests - Custom (Subscription Management):**

1. **Subscription Lifecycle:**
   - Create new subscription (active, with start/end dates)
   - Test subscription status (active vs expired based on dates)
   - Test subscription renewal (extend end_date)
   - Test subscription cancellation (soft delete)

2. **Date Management:**
   - Test valid date ranges (start_date <= end_date)
   - Test current subscriptions (start_date <= now <= end_date)
   - Test future subscriptions (start_date > now)
   - Test expired subscriptions (end_date < now)

3. **Pricing:**
   - Test price_per_credit storage
   - Test different pricing tiers
   - Test price changes over time (new subscription records)

4. **Stripe Integration:**
   - Test stripe_subscription_plan_id storage
   - Test finding subscription by Stripe ID
   - Test null Stripe ID (manual subscriptions)

5. **User Subscription Queries:**
   - Test finding all subscriptions for a user
   - Test finding active subscription for a user
   - Test subscription history (including deleted)
   - Test finding users by subscription plan

6. **Multi-Plan Support:**
   - Test user with multiple subscriptions (sequential or parallel)
   - Test upgrading/downgrading plans
   - Test overlapping subscriptions

### 5. Validation Rules
- **Dates**: start_date and end_date should be valid ISO timestamps
- **Price**: price_per_credit should be positive decimal
- **Active State**: Only one active subscription per user at a time (recommended)
- **Soft Delete**: is_deleted=true for cancelled subscriptions
- **Stripe ID**: Optional, can be null for manual/legacy subscriptions

### 6. Validation
- [ ] Run tests: `npm test -- src/users/users-to-subscription-plans/__tests__`
- [ ] Verify 100% pass rate
- [ ] Check all contract tests execute properly
- [ ] Verify subscription lifecycle and date handling works correctly

### 7. Completion
- [ ] Commit changes with proper message
- [ ] Create PR to develop branch

## Notes
- Junction table with business logic (dates, pricing, soft delete)
- Important for subscription management and billing
- Stripe integration for payment processing
- Soft delete allows subscription history tracking
- Follow SOA: Always use UserService to create test users
- May need SubscriptionPlanService to create test plans (check if exists)
- Focus on date-based subscription status logic
