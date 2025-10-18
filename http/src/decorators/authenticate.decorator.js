// src/plugins/authenticate.js
'use strict';

const { initUserService }   = require('../../../src/users');
const { initUserToRolesService }   = require('../../../src/users/user-to-roles');

// =============================================================
// Authenticate decorator: verifies JWT, loads user, hydrates roles
// =============================================================

/**
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 */
const authenticate = async (request, reply) => {
    try {
        const decoded            = await request.jwtVerify();
        const userService        = initUserService();
        const userToRolesService = initUserToRolesService();

        const user = await userService.getOne(
            { uuid : decoded.uuid },
            { includeHiddenFields : true }
        );

        if (! user || ! user?.uuid || ! user.isActive || user.isDeleted) {
            return reply.unauthorized();
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            return reply.unauthorized();
        }

        const entities = await userToRolesService.getRolesForUser(user.id);
        const roles =  entities.map(entity => {
            return {
                id    : entity.id,
                label : entity.label,
                value : entity.value,
            };
        });

        // Check if user has role DenyAll
        if (await userService.isDenyAll(user?.uuid)) {
            return reply.forbidden();
        }

        request.user = {
            ...user,
            roles           : roles,
            isAuthenticated : true,
            isGuest         : false
        };
    }
    catch (err) {
        request.log.error({ err }, 'Authentication failed');
        return reply.unauthorized();
    }
};

module.exports = {
    name    : 'authenticate',
    handler : authenticate
};