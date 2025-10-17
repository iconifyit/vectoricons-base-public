# Access Control Tests Task

## Module Description
The access-control module provides role-based access control (RBAC) functionality. It consists of a single service class `AccessControlService` that enforces access control policies based on user roles and resource ownership.

**Key Components:**
- `AccessControlService` - Main service class with role checking and enforcement logic
- No database entities or repositories (pure business logic)

## Access Control Logic
1. **DenyAll role** → Always denies access (highest priority)
2. **Admin/SuperAdmin roles** → Always grants access
3. **Resource ownership** → Grants access if actor owns the resource
4. **Default** → Denies access

## Key Tests to Implement

### 1. actorHasRole() Method Tests
- ✅ Should return true when actor has the specified role
- ✅ Should return false when actor doesn't have the role
- ✅ Should handle case-insensitive role matching
- ✅ Should handle roles as objects with `value` property
- ✅ Should return false for null/undefined actor
- ✅ Should return false for actor with empty roles array
- ✅ Should handle roles array with multiple roles

### 2. enforce() Method - Role Hierarchy Tests
- ✅ DenyAll role should always return false
- ✅ Admin role should always return true
- ✅ SuperAdmin role should always return true
- ✅ Admin should override DenyAll (Admin takes precedence)
- ✅ Should handle actor with multiple roles

### 3. enforce() Method - Resource Ownership Tests
- ✅ Should grant access when actor owns the resource
- ✅ Should deny access when actor doesn't own resource
- ✅ Should handle numeric vs string ID comparison
- ✅ Should handle null/undefined resource
- ✅ Should handle resource without ownerId
- ✅ Should handle actor without id

### 4. Edge Cases
- ✅ Should handle null actor
- ✅ Should handle null resource
- ✅ Should handle missing action parameter
- ✅ Should handle actor with no roles property
- ✅ Should correctly prioritize: DenyAll → Admin/SuperAdmin → Ownership → Default deny

## Setup/Teardown
- No database setup required (pure logic service)
- No mocking required (no external dependencies)
- Service instantiation is straightforward

## Dependencies
- `../../utils/enums` - For UserRoles enum
- No other module dependencies

## Files to Create/Modify
- [ ] Create: `src/common/access-control/__tests__/AccessControlService.test.js`

## Time Estimate
- Test implementation: ~30-45 minutes
- Total: ~45 minutes

## Notes
- This is a simple, stateless service with pure business logic
- No need for contract tests (no Entity/Repository/Service trio)
- Focus on comprehensive coverage of role hierarchy and ownership logic
- All logic is synchronous (no async testing needed)
