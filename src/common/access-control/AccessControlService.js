'use strict';

const { UserRoles } = require('../../utils/enums');

/**
 * @module Access Control
 * @fileoverview AccessControlService - Role-Based Access Control (RBAC) with priority-based enforcement.
 *
 * This service implements a hierarchical RBAC system that evaluates access requests based on
 * user roles and resource ownership. It's integrated throughout the service layer via the
 * `withAccessControl` mixin to automatically enforce permissions on CRUD operations.
 *
 * **Priority-Based Evaluation:**
 * ```
 * ┌─────────────────────────────────────────────┐
 * │ 1. DenyAll Role?        → DENY (highest)    │
 * │    └─> Always denies, even for admins       │
 * ├─────────────────────────────────────────────┤
 * │ 2. Admin/SuperAdmin?    → GRANT             │
 * │    └─> Full access to all resources         │
 * ├─────────────────────────────────────────────┤
 * │ 3. Resource Owner?      → GRANT             │
 * │    └─> actor.id === resource.ownerId        │
 * ├─────────────────────────────────────────────┤
 * │ 4. Default              → DENY (secure)     │
 * │    └─> Deny by default (least privilege)    │
 * └─────────────────────────────────────────────┘
 * ```
 *
 * **Architecture Integration:**
 * ```
 * HTTP Layer (Express/Fastify)
 *      ↓ (authenticate middleware)
 * Service Layer (with withAccessControl mixin)
 *      ↓ (automatic enforcement on CRUD operations)
 * AccessControlService.enforce()
 *      ↓ (evaluate roles + ownership)
 * Repository Layer (if granted)
 * ```
 *
 * **Service Layer Integration:**
 * Services using the `withAccessControl` mixin automatically enforce permissions:
 * ```javascript
 * class IconService extends withAccessControl(BaseService) {
 *   // getById, update, delete automatically check permissions
 * }
 *
 * // When called:
 * await iconService.update(iconId, data, { actor: currentUser });
 * // → AccessControlService.enforce() called automatically
 * // → Throws error if access denied
 * ```
 *
 * **User Roles Hierarchy:**
 * - **DenyAll**: Banned/suspended users (highest priority, always denies)
 * - **SuperAdmin**: Full system access (all resources)
 * - **Admin**: Full access to managed resources
 * - **Customer**: Access to own resources only
 * - **Guest**: No resource access (read-only public data)
 *
 * **Security Principles:**
 * 1. **Deny by Default**: All requests denied unless explicitly granted
 * 2. **Priority-Based**: DenyAll overrides everything, including Admin
 * 3. **Ownership Model**: Users can access their own resources
 * 4. **Admin Override**: Admins have full access (except if DenyAll)
 * 5. **Type Coercion**: Handles string/number ID comparison safely
 *
 * **Production Use Cases:**
 * 1. **CRUD Protection**: Automatic permission checks on service methods
 * 2. **Multi-Tenancy**: Ownership model isolates user data
 * 3. **Admin Tools**: SuperAdmin/Admin roles for support team
 * 4. **User Banning**: DenyAll role prevents access immediately
 * 5. **API Endpoints**: Enforce permissions before database queries
 *
 * **Policy Extensibility:**
 * The `policies` parameter allows custom access rules for future expansion:
 * ```javascript
 * const acl = new AccessControlService({
 *   policies: {
 *     'icons:publish': (actor, resource) => {
 *       // Custom logic: only verified users can publish
 *       return actor.isVerified && resource.status === 'pending';
 *     },
 *     'icons:feature': (actor, resource) => {
 *       // Only admins can feature icons
 *       return actor.roles.some(r => r.value === UserRoles.Admin);
 *     }
 *   }
 * });
 * ```
 *
 * @example
 * // Basic usage with service layer
 * const acl = new AccessControlService();
 *
 * const canAccess = await acl.enforce({
 *   actor: { id: 123, roles: [{ value: UserRoles.Customer }] },
 *   action: 'update',
 *   resource: { ownerId: 123 }
 * });
 * // Returns: true (actor owns resource)
 *
 * @example
 * // Admin access
 * const canDelete = await acl.enforce({
 *   actor: { id: 1, roles: [{ value: UserRoles.Admin }] },
 *   action: 'delete',
 *   resource: { ownerId: 456 }
 * });
 * // Returns: true (Admin can delete anything)
 *
 * @example
 * // DenyAll blocks everything
 * const canRead = await acl.enforce({
 *   actor: {
 *     id: 1,
 *     roles: [
 *       { value: UserRoles.DenyAll },
 *       { value: UserRoles.Admin }
 *     ]
 *   },
 *   action: 'read',
 *   resource: { ownerId: 1 }
 * });
 * // Returns: false (DenyAll overrides Admin)
 *
 * @example
 * // Integration with HTTP middleware
 * app.put('/api/icons/:id',
 *   authenticate, // Populates req.user
 *   async (req, res) => {
 *     const icon = await iconService.getById(req.params.id);
 *
 *     const allowed = await acl.enforce({
 *       actor: req.user,
 *       action: 'update',
 *       resource: icon
 *     });
 *
 *     if (!allowed) {
 *       return res.status(403).json({ error: 'Access denied' });
 *     }
 *
 *     await iconService.update(req.params.id, req.body);
 *     res.json({ success: true });
 *   }
 * );
 *
 * @see {@link withAccessControl} For automatic service-level enforcement
 * @see {@link UserRoles} For available role definitions
 */

/**
 * Role-Based Access Control (RBAC) service with hierarchical priority enforcement.
 *
 * AccessControlService provides a simple yet powerful RBAC implementation that:
 * - Evaluates access based on roles (DenyAll, Admin, SuperAdmin, Customer, Guest)
 * - Supports resource ownership (users can access their own resources)
 * - Integrates with service layer via withAccessControl mixin
 * - Uses priority-based evaluation (DenyAll > Admin > Ownership > Default Deny)
 * - Handles string/number ID comparison safely
 *
 * **How Priority Evaluation Works:**
 * 1. **DenyAll check first** - Banned users blocked immediately
 * 2. **Admin/SuperAdmin check** - Full access granted if admin
 * 3. **Ownership check** - Grant if actor owns resource
 * 4. **Default deny** - Secure by default (least privilege)
 *
 * **Integration Patterns:**
 *
 * **Pattern 1: Automatic Service-Level Enforcement (Recommended)**
 * ```javascript
 * // Service with automatic ACL checking
 * class IconService extends withAccessControl(BaseService) {
 *   // All CRUD methods automatically enforce permissions
 * }
 *
 * // Usage
 * await iconService.update(
 *   iconId,
 *   { name: 'new-name' },
 *   { actor: currentUser } // ACL checked automatically
 * );
 * ```
 *
 * **Pattern 2: Manual HTTP Middleware**
 * ```javascript
 * // Manual enforcement in route handlers
 * app.put('/api/icons/:id', authenticate, async (req, res) => {
 *   const icon = await iconService.getById(req.params.id);
 *   const allowed = await acl.enforce({
 *     actor: req.user,
 *     action: 'update',
 *     resource: icon
 *   });
 *   if (!allowed) return res.status(403).json({ error: 'Forbidden' });
 *   // ... proceed with update
 * });
 * ```
 *
 * **Pattern 3: Reusable ACL Middleware**
 * ```javascript
 * // Generic middleware factory
 * function aclMiddleware(resourceLoader, action) {
 *   return async (req, res, next) => {
 *     const resource = await resourceLoader(req);
 *     const allowed = await acl.enforce({
 *       actor: req.user,
 *       action,
 *       resource
 *     });
 *     if (!allowed) return res.status(403).json({ error: 'Forbidden' });
 *     next();
 *   };
 * }
 *
 * // Use in routes
 * app.put('/api/icons/:id',
 *   authenticate,
 *   aclMiddleware(req => iconService.getById(req.params.id), 'update'),
 *   updateIconHandler
 * );
 * ```
 *
 * **Performance Considerations:**
 * - Role checks are O(n) where n = number of roles (typically 1-3)
 * - Ownership check is O(1) - simple ID comparison
 * - No database queries - operates on in-memory objects
 * - Average execution time: < 0.1ms per enforce() call
 *
 * @class AccessControlService
 *
 * @example
 * // Basic construction (most common)
 * const acl = new AccessControlService();
 *
 * @example
 * // Admin can access any resource
 * const result = await acl.enforce({
 *   actor: { id: 1, roles: [{ value: 'ROLE_ADMIN' }] },
 *   action: 'delete',
 *   resource: { ownerId: 999 }
 * });
 * // Returns: true
 *
 * @example
 * // Owner can access their own resources
 * const result = await acl.enforce({
 *   actor: { id: 123, roles: [{ value: 'ROLE_CUSTOMER' }] },
 *   action: 'update',
 *   resource: { ownerId: 123 }
 * });
 * // Returns: true
 *
 * @example
 * // Non-owner cannot access other's resources
 * const result = await acl.enforce({
 *   actor: { id: 123, roles: [{ value: 'ROLE_CUSTOMER' }] },
 *   action: 'delete',
 *   resource: { ownerId: 456 }
 * });
 * // Returns: false
 *
 * @example
 * // DenyAll blocks even admins
 * const result = await acl.enforce({
 *   actor: {
 *     id: 1,
 *     roles: [
 *       { value: 'ROLE_DENYALL' },
 *       { value: 'ROLE_ADMIN' }
 *     ]
 *   },
 *   action: 'read',
 *   resource: { ownerId: 1 }
 * });
 * // Returns: false (DenyAll has highest priority)
 *
 * @example
 * // Custom policies for extensibility
 * const acl = new AccessControlService({
 *   policies: {
 *     'icons:publish': (actor, resource) => {
 *       return actor.isVerified && resource.status === 'pending';
 *     }
 *   }
 * });
 */
class AccessControlService {
    /**
     * Construct AccessControlService with optional custom policies.
     *
     * The policies parameter is reserved for future extensibility. Currently, the service
     * uses a simple role-based + ownership model, but custom policies can be added for
     * fine-grained control (e.g., "only verified users can publish", "only premium users
     * can feature content").
     *
     * **Current Evaluation Logic:**
     * - DenyAll role → Deny
     * - Admin/SuperAdmin role → Grant
     * - Resource ownership (actor.id === resource.ownerId) → Grant
     * - Default → Deny
     *
     * @param {Object} [options={}] - Configuration options
     * @param {Object} [options.policies=null] - Custom policy functions (future expansion)
     * @param {Function} [options.policies[policyName]] - Policy function: `(actor, resource) => boolean`
     *
     * @example
     * // Basic construction (default policies)
     * const service = new AccessControlService();
     *
     * @example
     * // With custom policies for future extensibility
     * const service = new AccessControlService({
     *   policies: {
     *     'icons:publish': (actor, resource) => {
     *       // Only verified users can publish pending icons
     *       return actor.isVerified && resource.status === 'pending';
     *     },
     *     'icons:feature': (actor, resource) => {
     *       // Only admins or premium users can feature icons
     *       return actor.isPremium || actor.roles.some(r => r.value === 'ROLE_ADMIN');
     *     }
     *   }
     * });
     *
     * @example
     * // Singleton pattern (recommended for app-wide use)
     * // acl-singleton.js
     * const AccessControlService = require('./AccessControlService');
     * module.exports = new AccessControlService();
     *
     * // app.js
     * const acl = require('./acl-singleton');
     * app.put('/api/icons/:id', async (req, res) => {
     *   const allowed = await acl.enforce({ actor: req.user, ... });
     *   // ...
     * });
     */
    constructor({ policies } = {}) {
        /**
         * Custom access control policies.
         * @type {Object|null}
         * @private
         */
        this.policies = policies || null;
    }

    /**
     * Checks if an actor has a specific role.
     *
     * Performs case-insensitive role matching and handles various edge cases
     * including null actors, missing roles arrays, and roles without values.
     *
     * @param {Object} actor - The user or entity to check
     * @param {Array<Object>} [actor.roles=[]] - Array of role objects
     * @param {string} actor.roles[].value - The role value/name
     * @param {string|UserRoles} roleEnum - The role to check for (case-insensitive)
     *
     * @returns {boolean} True if actor has the specified role
     *
     * @example
     * const hasAdmin = service.actorHasRole(user, UserRoles.Admin);
     * // Returns: true if user has Admin role
     *
     * @example
     * // Case-insensitive matching
     * const actor = { roles: [{ value: 'ROLE_ADMIN' }] };
     * service.actorHasRole(actor, 'role_admin'); // true
     * service.actorHasRole(actor, UserRoles.Admin); // true
     *
     * @example
     * // Handles null/undefined actors
     * service.actorHasRole(null, UserRoles.Admin); // false
     * service.actorHasRole({ roles: [] }, UserRoles.Admin); // false
     */
    actorHasRole(actor, roleEnum) {
        const needle = String(roleEnum).toLowerCase();
        const roles = Array.isArray(actor?.roles) ? actor.roles : [];
        return roles.some(role => String(role?.value || '').toLowerCase() === needle);
    }

    /**
     * Enforces access control for a given request.
     *
     * Evaluates access based on the following priority order:
     * 1. DenyAll role → Returns false (highest priority)
     * 2. Admin or SuperAdmin role → Returns true
     * 3. Resource ownership → Returns true if actor.id matches resource.ownerId
     * 4. Default → Returns false
     *
     * Note: ID comparison uses string coercion to handle both string and numeric IDs.
     *
     * @async
     * @param {Object} params - Enforcement parameters
     * @param {Object} params.actor - The user requesting access
     * @param {number|string} [params.actor.id] - Actor's unique identifier
     * @param {Array<Object>} [params.actor.roles] - Actor's roles
     * @param {string} [params.action] - The action being attempted (e.g., 'read', 'write', 'delete')
     * @param {Object} [params.resource] - The resource being accessed
     * @param {number|string} [params.resource.ownerId] - Owner's ID if applicable
     *
     * @returns {Promise<boolean>} True if access is granted, false otherwise
     *
     * @example
     * // Admin always has access
     * const result = await service.enforce({
     *   actor: { id: 1, roles: [{ value: UserRoles.Admin }] },
     *   action: 'delete',
     *   resource: { ownerId: 999 }
     * });
     * // Returns: true (Admin overrides ownership)
     *
     * @example
     * // Owner has access to their own resources
     * const result = await service.enforce({
     *   actor: { id: 123, roles: [{ value: UserRoles.Customer }] },
     *   action: 'read',
     *   resource: { ownerId: 123 }
     * });
     * // Returns: true (ownership grants access)
     *
     * @example
     * // DenyAll prevents access even for admins
     * const result = await service.enforce({
     *   actor: {
     *     id: 1,
     *     roles: [
     *       { value: UserRoles.DenyAll },
     *       { value: UserRoles.Admin }
     *     ]
     *   },
     *   action: 'read',
     *   resource: { ownerId: 1 }
     * });
     * // Returns: false (DenyAll has highest priority)
     *
     * @example
     * // Non-owner without elevated roles denied
     * const result = await service.enforce({
     *   actor: { id: 123, roles: [{ value: UserRoles.Customer }] },
     *   action: 'read',
     *   resource: { ownerId: 456 }
     * });
     * // Returns: false (default deny)
     *
     * @example
     * // Handles string/number ID comparison
     * const result = await service.enforce({
     *   actor: { id: '123', roles: [{ value: UserRoles.Customer }] },
     *   action: 'read',
     *   resource: { ownerId: 123 } // Number
     * });
     * // Returns: true (string '123' equals number 123)
     */
    async enforce({ actor, action, resource }) {
        // Priority 1: DenyAll role always denies
        if (this.actorHasRole(actor, UserRoles.DenyAll)) return false;

        // Priority 2: Admin roles always grant access
        if (this.actorHasRole(actor, UserRoles.Admin)) return true;
        if (this.actorHasRole(actor, UserRoles.SuperAdmin)) return true;

        // Priority 3: Resource ownership grants access
        if (resource && actor && resource.ownerId != null && actor.id != null) {
            const sameOwner = String(resource.ownerId) === String(actor.id);
            if (sameOwner) return true;
        }

        // Priority 4: Default deny
        return false;
    }
}

module.exports = AccessControlService;
