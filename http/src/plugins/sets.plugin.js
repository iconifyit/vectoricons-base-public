'use strict';

const { initSetService, SetEntity } = require('../../../src/products/sets');
const {
    list,
    getItem,
    createItem,
    patchItem,
    deleteItem,
} = require('../factory');
const schemas = require('../schemas/sets');

/**
 * Sets Plugin
 * Provides CRUD endpoints for managing sets.
 * Routes:
 * - GET /set/:userId/:page/:pageSize
 * - GET /set/:page/:pageSize
 * - GET /set/
 * - GET /set/:id
 * - POST /set
 * - PATCH /set/:id
 * - DELETE /set/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @name setsPlugin
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const plugin = async (fastify, opts) => {
    const service = initSetService();

    const baseConfig = {
        service     : service,
        entityClass : SetEntity,
        baseWhere   : {},
    };

    /**
     * GET /set/user/:userId/:page/:pageSize
     * GET /set/:page/:pageSize
     * Supports query params for filtering: familyId, isActive
     * Returns paginated list of sets by userId
     */
    await list({
        route     : '/user/:userId/:page/:pageSize',
        service   : service,
        schema    : schemas.SetPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.params.userId)  filters.userId   = Number(req.params.userId);
            if (req.query.familyId) filters.familyId = Number(req.query.familyId);
            if (req.query.styleId)  filters.styleId  = Number(req.query.styleId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /set/user/:userId/:page/:pageSize
     * GET /set/:page/:pageSize
     * Supports query params for filtering: familyId, isActive
     * Returns paginated list of sets by userId
     */
    await list({
        route     : '/family/:family/:page/:pageSize',
        service   : service,
        schema    : schemas.SetPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.params.family) filters.familyId = Number(req.params.family);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);  
    
    /**
     * Get /set/style/:styleId/:page/:pageSize
     * Supports query params for filtering: familyId, isActive
     * Returns paginated list of sets by styleId 
     */
    await list({
        route     : '/style/:styleId/:page/:pageSize',
        service   : service,
        schema    : schemas.SetPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.params.styleId) filters.styleId  = Number(req.params.styleId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /set/:page/:pageSize
     * Supports query params for filtering: familyId, isActive
     * Returns paginated list of sets
     */
    await list({
        route     : '/:page/:pageSize',
        service   : service,
        schema    : schemas.SetPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.familyId) filters.familyId = Number(req.query.familyId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /set/
     * Supports query params for filtering: familyId, isActive
     * Returns paginated list of sets
     */
    await list({
        route     : '/',
        service   : service,
        schema    : schemas.SetPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.familyId) filters.familyId = Number(req.query.familyId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /set/:id
     * Returns a single set by ID
     */
    await getItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'set',
        ...baseConfig,
    })(fastify);

    /**
     * POST /set
     * Creates a new set
     * Body must match CreateSchema
     * Returns the created set
     */
    await createItem({
        route       : '/',
        name        : 'set',
        schema      : schemas.CreateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /set/:id
     * Updates a set by ID
     * Body must match UpdateSchema
     * Returns the updated set
     */
    await patchItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'set',
        schema      : schemas.UpdateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /set/:id
     * Deletes a set by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'set',
        schema      : schemas.DeleteSchema,
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix: '/set',
};
