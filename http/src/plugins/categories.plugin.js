'use strict';

const { initCategoryService, CategoryEntity } = require('../../../src/products/categories');
const {
    paginate,
    list,
    getItem,
    createItem,
    patchItem,
    deleteItem,
} = require('../factory');
const schemas = require('../schemas/categories');

/**
 * Categories Plugin
 * Provides CRUD endpoints for managing categories.
 * Routes:
 * - GET /category/:page/:pageSize
 * - GET /category/
 * - GET /category/:id
 * - POST /category
 * - PATCH /category/:id
 * - DELETE /category/:id
 * Each route supports appropriate query parameters and request bodies as defined in the schemas.
 * @param {FastifyInstance} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
const plugin = async (fastify, opts) => {
    const service = initCategoryService();

    const baseConfig = {
        service,
        entityClass: CategoryEntity,
        baseWhere: {},
    };

    /**
     * GET /category/:page/:pageSize
     * Supports query params for filtering: isActive
     * Returns paginated list of categories
     */
    await list({
        route: '/:page/:pageSize',
        service,
        schema: schemas.CategoryPaginatedSchema,
        getWhere: (req) => {
            const filters = {};
            if (req.query.isActive != null) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /category/
     * Supports query params for filtering: isActive
     * Returns paginated list of categories
     */
    await list({
        route: '/',
        service,
        schema: schemas.CategoryPaginatedSchema,
        getWhere: (req) => {
            const filters = {};
            if (req.query.isActive != null) filters.isActive = req.query.isActive;
            return filters;
        },
    })(fastify);

    /**
     * GET /category/:id
     * Returns a single category by ID
     */
    await getItem({
        route: '/:id',
        idParam: 'id',
        parseId: (v) => Number(v),
        name: 'category',
        ...baseConfig,
    })(fastify);

    /**
     * POST /category
     * Creates a new category
     * Body must match CreateCategorySchema
     * Returns the created category
     */
    await createItem({
        route: '/',
        name: 'category',
        ...baseConfig,
    })(fastify);

    /**
     * PATCH /category/:id
     * Updates a category by ID
     * Body must match UpdateCategorySchema
     * Returns the updated category
     */
    await patchItem({
        route: '/:id',
        idParam: 'id',
        parseId: (v) => Number(v),
        name: 'category',
        ...baseConfig,
    })(fastify);

    /**
     * DELETE /category/:id
     * Deletes a category by ID
     * Returns { deleted: true } if successful
     */
    await deleteItem({
        route: '/:id',
        idParam: 'id',
        parseId: (v) => Number(v),
        name: 'category',
        ...baseConfig,
    })(fastify);
};

module.exports = {
    handler: plugin,
    prefix: '/category',
};
