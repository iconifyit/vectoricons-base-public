/**
 * @typedef {Object} CategorySchema
 * @property {number} id
 * @property {string} name
 * @property {boolean} isActive
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 */
const CategorySchema = {
    type: 'object',
    properties: {
        id        : { type: 'integer' },
        name      : { type: 'string', maxLength: 255 },
        isActive  : { type: 'boolean' },
        createdAt : { type: 'string', format: 'date-time' },
        updatedAt : { type: 'string', format: 'date-time' }
    },
    required: ['name', 'isActive', 'createdAt', 'updatedAt'],
    additionalProperties: false
};

/**
 * @typedef {Object} CategoryListSchema
 * @property {CategorySchema[]} results
 */
const CategoryListSchema = {
    type: 'array',
    items: CategorySchema
};

/**
 * @typedef {Object} CategoryPaginatedSchema
 * @property {CategorySchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} [cacheHit]
 */
const CategoryPaginatedSchema = {
    type: 'object',
    properties: {
        results    : CategoryListSchema,
        total      : { type: 'integer' },
        page       : { type: 'integer' },
        pageSize   : { type: 'integer' },
        totalPages : { type: 'integer' },
        cacheHit   : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** @typedef {Object} CategoryDeletedSchema
 * @property {boolean} deleted
 */
const CategoryDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateCategorySchema
 * @property {string} name
 * @property {boolean} isActive
 */
const CreateCategorySchema = {
    body: {
        type: 'object',
        properties: {
            name     : { type: 'string', minLength: 1, maxLength: 255 },
            isActive : { type: 'boolean' }
        },
        required: ['name', 'isActive'],
        additionalProperties: false
    },
    response: { 201: CategorySchema },
};

/**
 * @typedef {Object} ListCategoriesSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {boolean} [isActive]
 * @property {CategorySchema[]} 200
 */
const ListCategoriesSchema = {
    params: {
        type: 'object',
        properties: {
            page     : { type: 'integer', minimum: 1, default: 1 },
            pageSize : { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            isActive : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: CategorySchema
        }
    }
};

/**
 * @typedef {Object} GetCategorySchema
 * @property {number} id
 * @property {CategorySchema} 200
 * @property {Object} 404
 */
const GetCategorySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: CategorySchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        },
    }
};

/**
 * @typedef {Object} UpdateCategorySchema
 * @property {number} id
 * @property {Object} body
 * @property {CategorySchema} 200
 * @property {Object} 404
 */
const UpdateCategorySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    body: {
        type: 'object',
        properties: {
            name     : { type: 'string', minLength: 1, maxLength: 255 },
            isActive : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: CategorySchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        },
    }
};

/**
 * @typedef {Object} DeleteCategorySchema
 * @property {number} id
 * @property {CategoryDeletedSchema} 200
 * @property {Object} 404
 */
const DeleteCategorySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: CategoryDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        },
    }
};

module.exports = {
    CategorySchema,
    CategoryListSchema,
    CategoryPaginatedSchema,
    CategoryDeletedSchema,
    CreateSchema  : CreateCategorySchema,
    ListSchema    : ListCategoriesSchema,
    GetItemSchema : GetCategorySchema,
    UpdateSchema  : UpdateCategorySchema,
    DeleteSchema  : DeleteCategorySchema,
};