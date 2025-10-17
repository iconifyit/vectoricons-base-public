'use strict';

const { initFamilyService, FamilyEntity } = require('../../../src/products/families');
const {
    list,
    getItem,
    createItem,
    patchItem,
    deleteItem,
} = require('../factory');
const schemas = require('../schemas/families');

/**
 * Families Plugin
 * Provides CRUD endpoints for managing families.
 * Routes:
 * - GET /family/:userId/:page/:pageSize
 * - GET /family/:page/:pageSize
 * - GET /family/
 * - GET /family/:id
 * - POST /family
 * - PATCH /family/:id
 * - DELETE /family/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const plugin = async (fastify, opts) => {
    const service = initFamilyService();

    const baseConfig = {
        service     : service,
        entityClass : FamilyEntity,
        baseWhere   : {},
    };

    /**
     * GET /family/:userId/:page/:pageSize
     * GET /family/:page/:pageSize
     * Supports query params for filtering: teamId, licenseId, isActive, isDeleted
     * Returns paginated list of families by userId
     */
    await list({
        route     : '/user/:userId/:page/:pageSize',
        service   : service,
        schema    : schemas.FamilyPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.params.userId) filters.userId = Number(req.params.userId);
            if (req.query.teamId) filters.teamId = Number(req.query.teamId);
            if (req.query.licenseId) filters.licenseId = Number(req.query.licenseId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /family/:page/:pageSize
     * Supports query params for filtering: userId, teamId, licenseId, isActive, isDeleted
     * Returns paginated list of families
     */
    await list({
        route     : '/:page/:pageSize',
        service   : service,
        schema    : schemas.FamilyPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.userId) filters.userId = Number(req.query.userId);
            if (req.query.teamId) filters.teamId = Number(req.query.teamId);
            if (req.query.licenseId) filters.licenseId = Number(req.query.licenseId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /family/
     * Supports query params for filtering: userId, teamId, licenseId, isActive, isDeleted
     * Returns paginated list of families
     */
    await list({
        route     : '/',
        service   : service,
        schema    : schemas.FamilyPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.userId) filters.userId = Number(req.query.userId);
            if (req.query.teamId) filters.teamId = Number(req.query.teamId);
            if (req.query.licenseId) filters.licenseId = Number(req.query.licenseId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /family/:id
     * Returns a single family by ID
     */
    await getItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'family',
        ...baseConfig,
    })(fastify);

    /**
     * POST /family
     * Creates a new family
     * Body must match CreateFamilySchema
     * Returns the created family
     */
    await createItem({
        route       : '/',
        name        : 'family',
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /family/:id
     * Updates a family by ID
     * Body must match UpdateFamilySchema
     * Returns the updated family
     */
    await patchItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'family',
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /family/:id
     * Deletes a family by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'family',
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix: '/family',
};
