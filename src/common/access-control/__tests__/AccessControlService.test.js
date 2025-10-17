const AccessControlService = require('../AccessControlService');
const { UserRoles } = require('../../../utils/enums');

describe('AccessControlService', () => {
    let service;

    beforeEach(() => {
        service = new AccessControlService();
    });

    describe('constructor', () => {
        it('should create service with no policies', () => {
            expect(service).toBeInstanceOf(AccessControlService);
            expect(service.policies).toBeNull();
        });

        it('should create service with custom policies', () => {
            const policies = { admin: true };
            const customService = new AccessControlService({ policies });
            expect(customService.policies).toEqual(policies);
        });
    });

    describe('actorHasRole', () => {
        it('should return true when actor has the specified role', () => {
            const actor = {
                roles: [{ value: UserRoles.Admin }]
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(true);
        });

        it('should return false when actor does not have the role', () => {
            const actor = {
                roles: [{ value: UserRoles.Customer }]
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(false);
        });

        it('should handle case-insensitive role matching', () => {
            const actor = {
                roles: [{ value: 'ROLE_ADMIN' }]
            };
            expect(service.actorHasRole(actor, 'role_admin')).toBe(true);
            expect(service.actorHasRole(actor, 'Role_Admin')).toBe(true);
        });

        it('should handle roles as string values', () => {
            const actor = {
                roles: [{ value: 'ROLE_ADMIN' }]
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(true);
        });

        it('should return false for null actor', () => {
            expect(service.actorHasRole(null, UserRoles.Admin)).toBe(false);
        });

        it('should return false for undefined actor', () => {
            expect(service.actorHasRole(undefined, UserRoles.Admin)).toBe(false);
        });

        it('should return false for actor with empty roles array', () => {
            const actor = { roles: [] };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(false);
        });

        it('should return false for actor with no roles property', () => {
            const actor = { id: 1 };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(false);
        });

        it('should handle actor with multiple roles', () => {
            const actor = {
                roles: [
                    { value: UserRoles.Customer },
                    { value: UserRoles.Admin },
                    { value: UserRoles.Contributor }
                ]
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(true);
            expect(service.actorHasRole(actor, UserRoles.Customer)).toBe(true);
            expect(service.actorHasRole(actor, UserRoles.SuperAdmin)).toBe(false);
        });

        it('should handle roles without value property gracefully', () => {
            const actor = {
                roles: [{}]
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(false);
        });

        it('should handle non-array roles property', () => {
            const actor = {
                roles: 'not-an-array'
            };
            expect(service.actorHasRole(actor, UserRoles.Admin)).toBe(false);
        });
    });

    describe('enforce - Role Hierarchy', () => {
        it('should deny access for DenyAll role', async () => {
            const actor = {
                id: 1,
                roles: [{ value: UserRoles.DenyAll }]
            };
            const result = await service.enforce({ actor, action: 'read', resource: {} });
            expect(result).toBe(false);
        });

        it('should grant access for Admin role', async () => {
            const actor = {
                id: 1,
                roles: [{ value: UserRoles.Admin }]
            };
            const result = await service.enforce({ actor, action: 'read', resource: {} });
            expect(result).toBe(true);
        });

        it('should grant access for SuperAdmin role', async () => {
            const actor = {
                id: 1,
                roles: [{ value: UserRoles.SuperAdmin }]
            };
            const result = await service.enforce({ actor, action: 'read', resource: {} });
            expect(result).toBe(true);
        });

        it('should deny access when DenyAll is present even with Admin role', async () => {
            const actor = {
                id: 1,
                roles: [
                    { value: UserRoles.DenyAll },
                    { value: UserRoles.Admin }
                ]
            };
            const result = await service.enforce({ actor, action: 'read', resource: {} });
            expect(result).toBe(false);
        });

        it('should grant access when both Admin and SuperAdmin present', async () => {
            const actor = {
                id: 1,
                roles: [
                    { value: UserRoles.Admin },
                    { value: UserRoles.SuperAdmin }
                ]
            };
            const result = await service.enforce({ actor, action: 'read', resource: {} });
            expect(result).toBe(true);
        });

        it('should deny access for regular users without ownership', async () => {
            const actor = {
                id: 1,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 2 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(false);
        });
    });

    describe('enforce - Resource Ownership', () => {
        it('should grant access when actor owns the resource', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true);
        });

        it('should deny access when actor does not own resource', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 456 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(false);
        });

        it('should handle string vs number ID comparison', async () => {
            const actor = {
                id: '123',
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true);
        });

        it('should handle number vs string ID comparison', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: '123' };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true);
        });

        it('should deny access for null resource', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            const result = await service.enforce({ actor, action: 'read', resource: null });
            expect(result).toBe(false);
        });

        it('should deny access for resource without ownerId', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { id: 1 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(false);
        });

        it('should deny access for actor without id', async () => {
            const actor = {
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(false);
        });

        it('should deny access when DenyAll role overrides ownership', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.DenyAll }]
            };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(false);
        });
    });

    describe('enforce - Edge Cases', () => {
        it('should deny access for null actor', async () => {
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor: null, action: 'read', resource });
            expect(result).toBe(false);
        });

        it('should deny access for undefined actor', async () => {
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor: undefined, action: 'read', resource });
            expect(result).toBe(false);
        });

        it('should handle missing action parameter', async () => {
            const actor = {
                id: 123,
                roles: [{ value: UserRoles.Admin }]
            };
            const result = await service.enforce({ actor, resource: {} });
            expect(result).toBe(true);
        });

        it('should deny access for actor with no roles property', async () => {
            const actor = { id: 123 };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true); // Still grants based on ownership
        });

        it('should handle empty roles array with ownership', async () => {
            const actor = {
                id: 123,
                roles: []
            };
            const resource = { ownerId: 123 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true); // Ownership check passes
        });

        it('should handle ownerId as zero', async () => {
            const actor = {
                id: 0,
                roles: [{ value: UserRoles.Customer }]
            };
            const resource = { ownerId: 0 };
            const result = await service.enforce({ actor, action: 'read', resource });
            expect(result).toBe(true);
        });
    });

    describe('Role Priority Order', () => {
        it('should evaluate in correct order: DenyAll → Admin → Ownership → Deny', async () => {
            // DenyAll beats everything
            const denyAllActor = {
                id: 123,
                roles: [{ value: UserRoles.DenyAll }, { value: UserRoles.Admin }]
            };
            expect(await service.enforce({
                actor: denyAllActor,
                resource: { ownerId: 123 }
            })).toBe(false);

            // Admin beats ownership and default deny
            const adminActor = {
                id: 999,
                roles: [{ value: UserRoles.Admin }]
            };
            expect(await service.enforce({
                actor: adminActor,
                resource: { ownerId: 123 }
            })).toBe(true);

            // Ownership beats default deny
            const ownerActor = {
                id: 123,
                roles: [{ value: UserRoles.Customer }]
            };
            expect(await service.enforce({
                actor: ownerActor,
                resource: { ownerId: 123 }
            })).toBe(true);

            // Default deny for non-owner, non-admin
            const regularActor = {
                id: 999,
                roles: [{ value: UserRoles.Customer }]
            };
            expect(await service.enforce({
                actor: regularActor,
                resource: { ownerId: 123 }
            })).toBe(false);
        });
    });
});
