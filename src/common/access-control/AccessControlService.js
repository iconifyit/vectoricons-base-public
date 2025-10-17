'use strict';

const { UserRoles } = require('../../utils/enums');

/**
 * Role-Based Access Control (RBAC) service with hierarchical enforcement.
 *
 * Implements a priority-based access control system:
 * 1. DenyAll role → Always denies (highest priority)
 * 2. Admin/SuperAdmin roles → Always grants access
 * 3. Resource ownership → Grants if actor owns resource
 * 4. Default → Denies access
 *
 * @class AccessControlService
 * @example
 * const acl = new AccessControlService();
 * const canAccess = await acl.enforce({
 *   actor: user,
 *   action: 'read',
 *   resource: icon
 * });
 *
 * @example
 * // With custom policies
 * const acl = new AccessControlService({
 *   policies: {
 *     'products:read': (actor, resource) => actor.isVerified
 *   }
 * });
 */
class AccessControlService {
    /**
     * Creates an instance of AccessControlService.
     *
     * @param {Object} [options={}] - Configuration options
     * @param {Object} [options.policies=null] - Custom policy definitions for future expansion
     *
     * @example
     * const service = new AccessControlService();
     *
     * @example
     * // With custom policies
     * const service = new AccessControlService({
     *   policies: {
     *     'admin:delete': (actor) => actor.isSuperAdmin
     *   }
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
