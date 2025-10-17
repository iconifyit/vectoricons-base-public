'use strict';

const { initImageService, ImageEntity } = require('../../../src/images');
const {
    list,
    getItem,
    createItem,
    patchItem,
    deleteItem,
} = require('../factory');
const schemas = require('../schemas/images');

/**
 * Images Plugin
 * Provides CRUD endpoints for managing images.
 * Routes:
 * - GET /image/:entityType/:entityId/:page/:pageSize
 * - GET /image/:page/:pageSize
 * - GET /image/:id
 * - POST /image
 * - PATCH /image/:id
 * - DELETE /image/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const plugin = async (fastify, opts) => {
    const service = initImageService();

    const baseConfig = {
        service     : service,
        entityClass : ImageEntity,
        baseWhere   : {},
    }

    /**
     * GET /image/:entityType/:entityId/:page/:pageSize
     * Supports query param isDeleted
     * Returns paginated list of images by entityType and entityId
     */
    await list({
        route     : '/:entityType/:entityId/:page/:pageSize',
        service   : service,
        schema    : schemas.ImagePaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            if (req.params.entityType) filters.entityType = req.params.entityType;
            if (req.params.entityId) filters.entityId = Number(req.params.entityId);
            return filters;
        },
    })(fastify);

    /**
     * GET /image/:page/:pageSize
     * Supports query params: entityType, entityId, isDeleted
     * Returns paginated list of images
     */
    await list({
        route     : '/:page/:pageSize',
        service   : service,
        schema    : schemas.ImagePaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.entityType) filters.entityType = req.query.entityType;
            if (req.query.entityId) filters.entityId = Number(req.query.entityId);
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /image/
     * Supports query params: entityType, entityId, isDeleted
     * Returns paginated list of images
     */
    await list({
        route     : '/',
        service   : service,
        schema    : schemas.ImagePaginatedSchema,
        getWhere  : (req) => {
            const filters = {};
            if (req.query.entityType) filters.entityType = req.query.entityType;
            if (req.query.entityId) filters.entityId = Number(req.query.entityId);
            if (req.query.isDeleted !== undefined) filters.isDeleted = req.query.isDeleted;
            return filters;
        },
    })(fastify);

    /**
     * GET /image/:id
     * Returns a single image by ID
     */
    await getItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'image',
        ...baseConfig,
    })(fastify);

    /**
     * POST /image
     * Creates a new image
     * Body must match CreateSchema
     * Returns the created image
     */
    await createItem({
        route       : '/',
        name        : 'image',
        schema      : schemas.CreateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /image/:id
     * Updates an image by ID
     * Body must match UpdateSchema
     * Returns the updated image
     */
    await patchItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'image',
        schema      : schemas.UpdateSchema,
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /image/:id
     * Deletes an image by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route       : '/:id',
        idParam     : 'id',
        parseId     : (v) => Number(v),
        name        : 'image',
        schema      : schemas.DeleteSchema,
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix: '/image',
};
