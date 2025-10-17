// http/src/decorators/authorize.js
'use strict';

const { UserRoles } = require('../../../src/config/enums');
const { initUserService } = require('../../../src/users');

const enumValueByKey = new Map(
    Object.entries(UserRoles).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()])
);
const enumValues = new Set([...enumValueByKey.values()]);

const toEnumValueLower = (s) => {
    const x = String(s).trim().toLowerCase();
    if (enumValues.has(x)) return x;
    if (enumValueByKey.has(x)) return enumValueByKey.get(x);
    return null;
};

module.exports = {
    name    : 'authorize',
    handler : (allowedRoles = []) => {
        return async (req, reply) => {
            const userService = initUserService();

            if (await userService.isDenyAll(req?.user?.uuid)) {
                return reply.forbidden();
            }

            const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];

            const userRoleValues = new Set(
                roles.flatMap(role => {
                    const valueLower      = String(role?.value || '').toLowerCase();
                    const labelLower      = String(role?.label || '').toLowerCase();
                    const fromLabel       = enumValueByKey.get(labelLower);
                    const fromLabelLower  = fromLabel ? String(fromLabel).toLowerCase() : null;
                    return [valueLower, fromLabelLower].filter(Boolean);
                })
            );

            const allowSelf = allowedRoles.includes(UserRoles.Self);

            const requiredRoleEnums = allowedRoles
                .filter(entry => entry !== UserRoles.Self)
                .map(toEnumValueLower)
                .filter(Boolean);

            const hasAllowedRole = requiredRoleEnums.some(required => userRoleValues.has(required));
            const isSelf = allowSelf && String(req.params?.uuid || '') === String(req.user?.uuid || '');

            if (!hasAllowedRole && !isSelf) {
                return reply.forbidden();
            }
        };
    }
};