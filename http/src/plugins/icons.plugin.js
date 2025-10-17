'use strict';

const { initIconService, IconEntity } = require('../../../src/products/icons');
const { paginate, list, getItem, createItem, patchItem, deleteItem } = require('../factory');
const schemas = require('../schemas/icons');

/**
 * Icons Plugin
 * Provides CRUD endpoints for managing icons.
 * Routes:
 * - GET /icon/:userId/:page/:pageSize
 * - GET /icon/:page/:pageSize
 * - GET /icon
 * - GET /icon/:id
 * - POST /icon
 * - PATCH /icon/:id
 * - DELETE /icon/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const plugin = async (fastify, opts) => {
    const service = initIconService();

    const baseConfig = {
        service     : service,
        entityClass : IconEntity,
        baseWhere   : {},
    };

    /**
     * GET /icon/user/:userId/:page/:pageSize
     * Returns paginated list of icons by userId
     */
    await list({
        route     : '/user/:userId/:page/:pageSize',
        service   : service,
        schema    : schemas.IllustrationPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.setId)     filters.setId     = req.query.setId;
            if (req.query.styleId)   filters.styleId   = req.query.styleId;
            if (req.query.teamId)    filters.teamId    = req.query.teamId;
            if (req.query.isActive)  filters.isActive  = req.query.isActive;
            if (req.query.isDeleted) filters.isDeleted = req.query.isDeleted;
            if (req.params.userId)   filters.userId    = Number(req.params.userId);
            return filters;
        },
    })(fastify);

    /**
     * GET /icon/set/:setId/:page/:pageSize
     * Returns paginated list of icons by setId
     */
    await list({
        route     : '/set/:setId/:page/:pageSize',
        service   : service,
        schema    : schemas.IllustrationPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.setId)     filters.setId     = req.query.setId;
            if (req.query.styleId)   filters.styleId   = req.query.styleId;
            if (req.query.teamId)    filters.teamId    = req.query.teamId;
            if (req.query.isActive)  filters.isActive  = req.query.isActive;
            if (req.query.isDeleted) filters.isDeleted = req.query.isDeleted;
            if (req.params.setId)    filters.setId     = Number(req.params.setId);
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
        schema    : schemas.IconPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.params.styleId)  filters.styleId   = Number(req.params.styleId);
            if (req.query.setId)     filters.setId     = req.query.setId;
            if (req.query.teamId)    filters.teamId    = req.query.teamId;
            if (req.query.isActive)  filters.isActive  = req.query.isActive;
            if (req.query.isDeleted) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify); 

    /**
     * GET /icon/:page/:pageSize
     * Supports query params for filtering: setId, styleId, teamId, userId, isActive, isDeleted
     * Returns paginated list of icons
     */
    await list({
        route     : '/:page/:pageSize',
        service   : service,
        schema    : schemas.IconPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.setId) filters.setId = Number(req.query.setId);
            if (req.query.styleId) filters.styleId = Number(req.query.styleId);
            if (req.query.teamId) filters.teamId = Number(req.query.teamId);
            if (req.query.userId) filters.userId = Number(req.query.userId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /icon
     * Supports query params for filtering: setId, styleId, teamId, userId, isActive, isDeleted
     * Returns paginated list of icons
     */
    await list({
        route     : '/',
        service   : service,
        schema    : schemas.IconPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.setId) filters.setId = Number(req.query.setId);
            if (req.query.styleId) filters.styleId = Number(req.query.styleId);
            if (req.query.teamId) filters.teamId = Number(req.query.teamId);
            if (req.query.userId) filters.userId = Number(req.query.userId);
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /icon/:id
     * Returns a single icon by ID
     */
    await getItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'icon',
        schema      : schemas.GetItemSchema,
        ...baseConfig,
    })(fastify);

    /**
     * POST /icon
     * Creates a new icon
     * Body must match CreateSchema
     * Returns the created icon
     */
    await createItem({
        route       : '/',
        name        : 'icon',
        schema      : schemas.CreateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /icon/:id
     * Updates an icon by ID
     * Body must match UpdateSchema
     * Returns the updated icon
     */
    await patchItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'icon',
        schema      : schemas.UpdateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /icon/:id
     * Deletes an icon by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'icon',
        schema      : schemas.DeleteSchema,
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix: '/icon',
};
