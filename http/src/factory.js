'use strict';

/**
 * @fileoverview CRUD route factories for generating Fastify routes declaratively.
 *
 * This module provides factory functions that generate common REST API patterns
 * (list, get, create, update, delete) from configuration objects. Instead of
 * writing repetitive route handlers, define routes as data and let the factories
 * generate the implementation.
 *
 * All factories assume @fastify/sensible is registered on the Fastify instance
 * for httpErrors support.
 *
 * @example
 * // Generate a paginated list route
 * await list({
 *   route: '/:page/:pageSize',
 *   service: iconService,
 *   schema: IconPaginatedSchema,
 *   getWhere: (req) => ({ setId: req.query.setId })
 * })(fastify);
 *
 * @example
 * // Generate a get-by-id route
 * await getItem({
 *   route: '/:id',
 *   service: iconService,
 *   schema: GetItemSchema,
 *   name: 'icon'
 * })(fastify);
 */

/**
 * Maximum limit for pagination to prevent excessive data transfer.
 * @constant {number}
 */
const kDEFAULT_MAX_LIMIT = 200;

/**
 * Build JSON schemas for common response types from an entity class.
 *
 * Generates schemas for single entities, arrays of entities, paginated responses,
 * and delete confirmations. These schemas are used for Fastify route response validation.
 *
 * @param {Function} entityClass - Entity class with static getJsonSchema() method
 * @returns {Object} Object containing:
 *   - entitySchema: Schema for single entity
 *   - listSchema: Schema for array of entities
 *   - paginatedSchema: Schema for paginated response with metadata
 *   - deletedSchema: Schema for delete confirmation { deleted: boolean }
 *
 * @example
 * const schemas = buildSchemas(IconEntity);
 * // schemas.paginatedSchema can be used in route response validation
 */
const buildSchemas = (entityClass) => {
    const entitySchema = entityClass.getJsonSchema();
    const listSchema = { type: 'array', items: entitySchema };

    const paginatedSchema = {
        type: 'object',
        properties: {
            results    : listSchema,
            total      : { type: 'integer' },
            page       : { type: 'integer' },
            pageSize   : { type: 'integer' },
            totalPages : { type: 'integer' }
        },
        required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
        additionalProperties: false
    };

    const deletedSchema = {
        type: 'object',
        properties: { deleted: { type: 'boolean' } },
        required: ['deleted'],
        additionalProperties: false
    };

    return { entitySchema, listSchema, paginatedSchema, deletedSchema };
};

/**
 * Ensure a path ends with a trailing slash.
 * @param {string} path
 * @returns {string}
 */
const ensureTrailingSlash = (p) => (p.endsWith('/') ? p : `${p}/`);

/**
 * Build schema for pagination.
 */
const getPaginatedSchema = (listSchema) => {
    return {
        schema: {
            params: {
                type: 'object',
                properties: {
                    offset : { type: 'integer', minimum: 0 },
                    limit  : { type: 'integer', minimum: 1, maximum: kDEFAULT_MAX_LIMIT }
                },
                required: ['offset', 'limit'],
                additionalProperties: false
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        results    : listSchema,
                        total      : { type: 'integer' },
                        page       : { type: 'integer' },
                        pageSize   : { type: 'integer' },
                        totalPages : { type: 'integer' }
                    },
                    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
                    additionalProperties: false
                }
            }
        }
    };
};

/**
 * Paginate items with offset/limit parameters.
 */
const paginate = ({
    route = '/',
    service,
    listSchema,
    entityClass,
    where = {},
    preHandler = []
}) => async (fastify) => {
    const schema = getPaginatedSchema(listSchema);

    fastify.get(
        `${ensureTrailingSlash(route)}:offset/:limit`,
        { ...schema, preHandler },
        async (req) => {
            const offset = Number(req.params.offset);
            const limit  = Number(req.params.limit);

            if (!Number.isFinite(offset) || !Number.isFinite(limit)) {
                throw fastify.httpErrors.badRequest('offset and limit must be numbers');
            }

            const page = Math.floor(offset / Math.max(limit, 1)) + 1;

            return await service.paginate(where, page, limit);
        }
    );
};

/**
 * Factory function to generate a paginated list route with filtering.
 *
 * Creates a GET route that returns paginated results with filtering support.
 * The route delegates to service.paginate() and supports dynamic WHERE clauses
 * via the getWhere function.
 *
 * @param {Object} config - Route configuration
 * @param {string} config.route - Route path (e.g., '/:page/:pageSize')
 * @param {Object} config.service - Service instance with paginate() method
 * @param {Object} config.schema - Fastify route schema for validation
 * @param {Function} [config.getWhere] - Function to build WHERE clause from request
 *   Receives (req) and returns object of filter conditions
 * @param {number} [config.page=1] - Default page number
 * @param {number} [config.pageSize=100] - Default page size
 * @param {Array|Function} [config.preHandler=[]] - Fastify preHandler hooks
 *   (e.g., authentication, authorization)
 *
 * @returns {Function} Async function that registers the route with Fastify
 *
 * @example
 * // Generate a list route with filtering
 * await list({
 *   route: '/:page/:pageSize',
 *   service: iconService,
 *   schema: schemas.IconPaginatedSchema,
 *   getWhere: (req) => {
 *     const filters = {};
 *     if (req.query.setId) filters.setId = Number(req.query.setId);
 *     if (req.query.isActive !== undefined) filters.isActive = req.query.isActive;
 *     return filters;
 *   }
 * })(fastify);
 *
 * @example
 * // With authentication
 * await list({
 *   route: '/:page/:pageSize',
 *   service: iconService,
 *   schema: schemas.IconPaginatedSchema,
 *   preHandler: [authenticate, authorize([UserRoles.Admin])]
 * })(fastify);
 */
const list = ({
    route,
    service,
    schema,
    getWhere,
    page = 1,
    pageSize = 100,
    preHandler = []
}) => async (fastify) => {
    fastify.get(route, { schema, preHandler }, async (req, reply) => {
        const pageNum = Number(req.params.page) || page;
        const sizeNum = Number(req.params.pageSize) || pageSize;
        const where   = getWhere ? getWhere(req) : {};

        reply.meta = { cacheHit: Boolean(!!service?.cacheHit) };

        return await service.paginate(where, pageNum, sizeNum);
    });
};

/**
 * Factory function to generate a get-by-ID route.
 *
 * Creates a GET route that fetches a single item by ID. Returns 404 if not found.
 * Supports custom ID parameter names and parsing functions.
 *
 * @param {Object} config - Route configuration
 * @param {string} [config.path='/:id'] - Route path with ID parameter
 * @param {string} [config.idParam='id'] - Name of ID parameter in path
 * @param {Function} [config.parseId] - Function to parse ID from string (default: Number)
 * @param {Object} config.service - Service instance with getById() method
 * @param {Object} config.schema - Fastify route schema for validation
 * @param {Function} [config.entityClass] - Entity class (not currently used)
 * @param {string} [config.name='resource'] - Resource name for error messages
 * @param {Array|Function} [config.preHandler=[]] - Fastify preHandler hooks
 *
 * @returns {Function} Async function that registers the route with Fastify
 *
 * @example
 * await getItem({
 *   route: '/:id',
 *   service: iconService,
 *   schema: schemas.GetItemSchema,
 *   name: 'icon'
 * })(fastify);
 *
 * @example
 * // With UUID parsing
 * await getItem({
 *   route: '/:uuid',
 *   idParam: 'uuid',
 *   parseId: (v) => v.toString(),
 *   service: userService,
 *   schema: schemas.GetUserSchema,
 *   name: 'user'
 * })(fastify);
 */
const getItem = ({
    path = '/:id',
    idParam = 'id',
    parseId = (v) => Number(v),
    service,
    schema,
    entityClass,
    name = 'resource',
    preHandler = []
}) => async (fastify) => {
    fastify.get(path, { schema, preHandler }, async (req, reply) => {
        const id = parseId(req.params[idParam]);
        if (!Number.isFinite(id) || id < 1) {
            throw fastify.httpErrors.badRequest('Invalid id');
        }

        const entity = await service.getById(id);
        if (!entity) {
            throw fastify.httpErrors.notFound(`${name} not found`);
        }

        reply.meta = { cacheHit: Boolean(!!service?.cacheHit) };
        return entity;
    });
};

/**
 * Factory function to generate a create (POST) route.
 *
 * Creates a POST route that accepts JSON body, validates it, and creates a new item.
 * Request body is passed directly to service.create().
 *
 * @param {Object} config - Route configuration
 * @param {string} [config.path='/'] - Route path
 * @param {Object} config.service - Service instance with create() method
 * @param {Object} config.schema - Fastify route schema for validation
 * @param {Function} [config.entityClass] - Entity class (not currently used)
 * @param {string} [config.name='resource'] - Resource name for error messages
 * @param {Array|Function} [config.preHandler=[]] - Fastify preHandler hooks
 *
 * @returns {Function} Async function that registers the route with Fastify
 *
 * @example
 * await createItem({
 *   route: '/',
 *   service: iconService,
 *   schema: schemas.CreateSchema,
 *   name: 'icon'
 * })(fastify);
 */
const createItem = ({
    path = '/',
    service,
    schema,
    entityClass,
    name = 'resource',
    preHandler = []
}) => async (fastify) => {
    fastify.post(path, { schema, preHandler }, async (req, reply) => {
        try {
            const created = await service.create(req.body);
            reply.meta = { cacheHit: Boolean(!!service?.cacheHit) };
            return created;
        } 
        catch (err) {
            throw fastify.httpErrors.badRequest(err?.message || `Failed to create ${name}`);
        }
    });
};

/**
 * Factory function to generate a patch (PATCH/update) route.
 *
 * Creates a PATCH route that updates an existing item by ID. Returns 404 if not found.
 * Fetches the item before and after update to ensure existence and return fresh data.
 *
 * @param {Object} config - Route configuration
 * @param {string} [config.path='/:id'] - Route path with ID parameter
 * @param {string} [config.idParam='id'] - Name of ID parameter in path
 * @param {Function} [config.parseId] - Function to parse ID from string (default: Number)
 * @param {Object} config.service - Service instance with getById() and update() methods
 * @param {Object} config.schema - Fastify route schema for validation
 * @param {Function} [config.entityClass] - Entity class (not currently used)
 * @param {string} [config.name='resource'] - Resource name for error messages
 * @param {Array|Function} [config.preHandler=[]] - Fastify preHandler hooks
 *
 * @returns {Function} Async function that registers the route with Fastify
 *
 * @example
 * await patchItem({
 *   route: '/:id',
 *   service: iconService,
 *   schema: schemas.UpdateSchema,
 *   name: 'icon'
 * })(fastify);
 */
const patchItem = ({
    path = '/:id',
    idParam = 'id',
    parseId = (v) => Number(v),
    service,
    schema,
    entityClass,
    name = 'resource',
    preHandler = []
}) => async (fastify) => {
    fastify.patch(path, { schema, preHandler }, async (req, reply) => {
        const id = parseId(req.params[idParam]);
        if (!Number.isFinite(id) || id < 1) {
            throw fastify.httpErrors.badRequest('Invalid id');
        }

        const existing = await service.getById(id);
        if (!existing) {
            throw fastify.httpErrors.notFound(`${name} not found`);
        }

        try {
            await service.update(id, req.body);
            const fresh = await service.getById(id);
            reply.meta = { cacheHit: Boolean(!!service?.cacheHit) };
            return fresh;
        } 
        catch (err) {
            throw fastify.httpErrors.badRequest(err?.message || `Failed to update ${name}`);
        }
    });
};

/**
 * Factory function to generate a delete (DELETE) route.
 *
 * Creates a DELETE route that removes an item by ID. Returns 404 if not found.
 * Returns { deleted: true } on success, { deleted: false } if deletion failed.
 *
 * @param {Object} config - Route configuration
 * @param {string} [config.path='/:id'] - Route path with ID parameter
 * @param {string} [config.idParam='id'] - Name of ID parameter in path
 * @param {Function} [config.parseId] - Function to parse ID from string (default: Number)
 * @param {Object} config.service - Service instance with getById() and delete() methods
 * @param {Object} config.schema - Fastify route schema for validation
 * @param {Function} [config.entityClass] - Entity class (not currently used)
 * @param {string} [config.name='resource'] - Resource name for error messages
 * @param {Array|Function} [config.preHandler=[]] - Fastify preHandler hooks
 *
 * @returns {Function} Async function that registers the route with Fastify
 *
 * @example
 * await deleteItem({
 *   route: '/:id',
 *   service: iconService,
 *   schema: schemas.DeleteSchema,
 *   name: 'icon'
 * })(fastify);
 */
const deleteItem = ({
    path = '/:id',
    idParam = 'id',
    parseId = (v) => Number(v),
    service,
    schema,
    entityClass,
    name = 'resource',
    preHandler = []
}) => async (fastify) => {
    fastify.delete(path, { schema, preHandler }, async (req) => {
        const id = parseId(req.params[idParam]);
        if (!Number.isFinite(id) || id < 1) {
            throw fastify.httpErrors.badRequest('Invalid id');
        }

        const existing = await service.getById(id);
        if (!existing) {
            throw fastify.httpErrors.notFound(`${name} not found`);
        }

        try {
            const deleted = await service.delete(id);
            return { deleted: deleted >= 1 };
        } 
        catch (err) {
            throw fastify.httpErrors.badRequest(err?.message || `Failed to delete ${name}`);
        }
    });
};

/**
 * Higher-level factory to create a complete CRUD plugin from route definitions.
 *
 * Generates multiple CRUD routes (list, getItem, createItem, patchItem, deleteItem)
 * from an array of route configurations. Simplifies plugin creation by providing
 * common service and entity once and defining multiple routes declaratively.
 *
 * @param {Object} config - Plugin configuration
 * @param {Object} config.service - Service instance shared across all routes
 * @param {Function} config.entityClass - Entity class shared across all routes
 * @param {string} config.name - Resource name for error messages (e.g., 'icon')
 * @param {Array<Object>} config.routes - Array of route configurations
 * @param {string} config.routes[].kind - Route type: 'list', 'getItem', 'createItem', 'patchItem', 'deleteItem'
 * @param {Object} config.routes[] - Additional route-specific config (merged with common config)
 *
 * @returns {Function} Async Fastify plugin function
 * @throws {Error} If service, entityClass, or name is missing
 * @throws {Error} If unsupported route kind is specified
 *
 * @example
 * const iconCrudPlugin = makeCrudPlugin({
 *   service: iconService,
 *   entityClass: IconEntity,
 *   name: 'icon',
 *   routes: [
 *     {
 *       kind: 'list',
 *       route: '/:page/:pageSize',
 *       schema: schemas.IconPaginatedSchema,
 *       getWhere: (req) => ({ setId: req.query.setId })
 *     },
 *     {
 *       kind: 'getItem',
 *       path: '/:id',
 *       schema: schemas.GetItemSchema
 *     },
 *     {
 *       kind: 'createItem',
 *       path: '/',
 *       schema: schemas.CreateSchema,
 *       preHandler: [authenticate]
 *     }
 *   ]
 * });
 *
 * // Register plugin with Fastify
 * await fastify.register(iconCrudPlugin, { prefix: '/icons' });
 */
const makeCrudPlugin = ({
    service,
    entityClass,
    name,
    routes = []
}) => {
    if (typeof service !== 'object' || service === null) {
        throw new Error('makeCrudPlugin requires service');
    }

    if (!entityClass) {
        throw new Error('makeCrudPlugin requires entityClass');
    }

    if (!name) {
        throw new Error('makeCrudPlugin requires name');
    }

    return async (fastify) => {
        const common = { service, entityClass, name };

        for (const route of routes) {
            const { kind, ...rest } = route;

            if (kind === 'list') {
                await list({ ...common, ...rest })(fastify);
                continue;
            }

            if (kind === 'getItem') {
                await getItem({ ...common, ...rest })(fastify);
                continue;
            }

            if (kind === 'createItem') {
                await createItem({ ...common, ...rest })(fastify);
                continue;
            }

            if (kind === 'patchItem') {
                await patchItem({ ...common, ...rest })(fastify);
                continue;
            }

            if (kind === 'deleteItem') {
                await deleteItem({ ...common, ...rest })(fastify);
                continue;
            }

            throw new Error(`Unsupported route kind: ${kind}`);
        }
    };
};

module.exports = {
    buildSchemas,
    paginate,
    list,
    getItem,
    createItem,
    patchItem,
    deleteItem,
    makeCrudPlugin
};