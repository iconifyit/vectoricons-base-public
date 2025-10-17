/**
 * @typedef {Object} TagSchema
 * @property {number} id
 * @property {string} name
 * @property {boolean} isActive
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 */
const TagSchema = {
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
 * @typedef {Object} TagListSchema
 * @property {TagSchema[]} results
 */
const TagListSchema = {
    type: 'array',
    items: TagSchema
};

/**
 * @typedef {Object} TagPaginatedSchema
 * @property {TagSchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} cacheHit
 */
const TagPaginatedSchema = {
    type: 'object',
    properties: {
        results    : TagListSchema,
        total      : { type: 'integer' },
        page       : { type: 'integer' },
        pageSize   : { type: 'integer' },
        totalPages : { type: 'integer' },
        cacheHit   : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** 
 * @typedef {Object} TagDeletedSchema
 * @property {boolean} deleted
 */
const TagDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateTagSchema
 * @property {string} name
 * @property {boolean} isActive
 */
const CreateTagSchema = {
    body: {
        type: 'object',
        properties: {
            name     : { type: 'string', maxLength: 255 },
            isActive : { type: 'boolean' }
        },
        required: ['name', 'isActive'],
        additionalProperties: false
    },
    response: { 201: TagSchema }
};

/**
 * @typedef {Object} ListTagsSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {boolean} [isActive]
 * @property {TagSchema[]} 200
 */
const ListTagsSchema = {
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
            items: TagSchema
        }
    }
};

/**
 * @typedef {Object} GetTagSchema
 * @property {number} id
 * @property {TagSchema} 200
 * @property {Object} 404
 */
const GetTagSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: TagSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const UpdateTagSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    body: {
        type: 'object',
        properties: {
            name     : { type: 'string', maxLength: 255 },
            isActive : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: TagSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const DeleteTagSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: TagDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

module.exports = {
    TagSchema,
    TagListSchema,
    TagPaginatedSchema,
    TagDeletedSchema,
    CreateSchema  : CreateTagSchema,
    ListSchema    : ListTagsSchema,
    GetItemSchema : GetTagSchema,
    UpdateSchema  : UpdateTagSchema,
    DeleteSchema  : DeleteTagSchema
};