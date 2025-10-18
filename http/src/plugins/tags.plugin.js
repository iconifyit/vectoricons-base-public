'use strict';

const { initTagService, TagEntity } = require('../../../src/products/tags');

/**
 * Tags Plugin
 * Provides CRUD endpoints for managing tags.
 * Routes:
 * - GET /tag/:page/:pageSize
 * - GET /tag
 * - GET /tag/:id
 * - POST /tag
 * - PATCH /tag/:id
 * - DELETE /tag/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @name tagsPlugin
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const { list, getItem, createItem, patchItem, deleteItem } = require('../factory');
const schemas = require('../schemas/tags');

const plugin = async (fastify, opts) => {
    const service = initTagService();

    const baseConfig = {
        service     : service,
        entityClass : TagEntity,
        baseWhere   : {},
    };

    /**
     * GET /tag/:page/:pageSize
     * Supports query param for filtering: isActive
     * Returns paginated list of tags
     */
    await list({
        route     : '/:page/:pageSize',
        service   : service,
        schema    : schemas.TagPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /tag
     * Supports query param for filtering: isActive
     * Returns paginated list of tags
     */
    await list({
        route     : '/',
        service   : service,
        schema    : schemas.TagPaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /tag/:id
     * Returns a single tag by ID
     */
    await getItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'tag',
        schema      : schemas.GetItemSchema,
        ...baseConfig,
    })(fastify);

    /**
     * POST /tag
     * Creates a new tag
     * Body must match CreateSchema
     * Returns the created tag
     */
    await createItem({
        route       : '/',
        name        : 'tag',
        schema      : schemas.CreateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /tag/:id
     * Updates a tag by ID
     * Body must match UpdateSchema
     * Returns the updated tag
     */
    await patchItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'tag',
        schema      : schemas.UpdateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /tag/:id
     * Deletes a tag by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'tag',
        schema      : schemas.DeleteSchema,
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix : '/tag',
};
