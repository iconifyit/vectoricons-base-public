/**
 * @typedef {Object} IconSchema
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {number} width
 * @property {number} height
 * @property {number} setId
 * @property {number} styleId
 * @property {number} teamId
 * @property {number} userId
 * @property {string} uniqueId
 * @property {number} licenseId
 * @property {boolean} isActive
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 * @property {boolean} isDeleted
 */
const IconSchema = {
    type: 'object',
    properties: {
        id       : { type: 'integer' },
        name     : { type: 'string', maxLength: 255 },
        price    : { type: 'number' },
        width    : { type: 'number' },
        height   : { type: 'number' },
        setId    : { type: 'integer' },
        styleId  : { type: 'integer' },
        teamId   : { type: 'integer' },
        userId   : { type: 'integer' },
        uniqueId : { type: 'string' },
        licenseId: { type: 'integer' },
        isActive : { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        isDeleted: { type: 'boolean' }
    },
    required: [
        'name',
        'price',
        'width',
        'height',
        'setId',
        'styleId',
        'teamId',
        'userId',
        'uniqueId',
        'licenseId',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    additionalProperties: false
};

/**
 * @typedef {Object} IconListSchema
 * @property {IconSchema[]} results
 */
const IconListSchema = {
    type: 'array',
    items: IconSchema
};

/**
 * @typedef {Object} IconPaginatedSchema
 * @property {IconSchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} cacheHit
 */
const IconPaginatedSchema = {
    type: 'object',
    properties: {
        results   : IconListSchema,
        total     : { type: 'integer' },
        page      : { type: 'integer' },
        pageSize  : { type: 'integer' },
        totalPages: { type: 'integer' },
        cacheHit  : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** @typedef {Object} IconDeletedSchema
 * @property {boolean} deleted
 */
const IconDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateIconSchema
 * @property {string} name
 * @property {number} price
 * @property {number} width
 * @property {number} height
 * @property {number} setId
 * @property {number} styleId
 * @property {number} teamId
 * @property {number} userId
 * @property {string} uniqueId
 * @property {number} licenseId
 * @property {boolean} isActive
 */
const CreateIconSchema = {
    body: {
        type: 'object',
        properties: {
            name     : { type: 'string', maxLength: 255 },
            price    : { type: 'number' },
            width    : { type: 'number' },
            height   : { type: 'number' },
            setId    : { type: 'integer' },
            styleId  : { type: 'integer' },
            teamId   : { type: 'integer' },
            userId   : { type: 'integer' },
            uniqueId : { type: 'string' },
            licenseId: { type: 'integer' },
            isActive : { type: 'boolean' }
        },
        required: [
            'name',
            'price',
            'width',
            'height',
            'setId',
            'styleId',
            'teamId',
            'userId',
            'uniqueId',
            'licenseId',
            'isActive'
        ],
        additionalProperties: false
    },
    response: { 201: IconSchema }
};

/**
 * @typedef {Object} ListIconsSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {number} [setId]
 * @property {number} [styleId]
 * @property {number} [teamId]
 * @property {number} [userId]
 * @property {boolean} [isActive]
 * @property {boolean} [isDeleted]
 * @property {IconSchema[]} 200
 */
const ListIconsSchema = {
    params: {
        type: 'object',
        properties: {
            page     : { type: 'integer', minimum: 1, default: 1 },
            pageSize : { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            setId    : { type: 'integer' },
            styleId  : { type: 'integer' },
            teamId   : { type: 'integer' },
            userId   : { type: 'integer' },
            isActive : { type: 'boolean' },
            isDeleted: { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: IconSchema
        }
    }
};

/**
 * @typedef {Object} GetIconSchema
 * @property {number} id
 * @property {IconSchema} 200
 * @property {Object} 404
 */
const GetIconSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: IconSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const UpdateIconSchema = {
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
            price    : { type: 'number' },
            width    : { type: 'number' },
            height   : { type: 'number' },
            setId    : { type: 'integer' },
            styleId  : { type: 'integer' },
            teamId   : { type: 'integer' },
            userId   : { type: 'integer' },
            uniqueId : { type: 'string' },
            licenseId: { type: 'integer' },
            isActive : { type: 'boolean' },
            isDeleted: { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: IconSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const DeleteIconSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: IconDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

module.exports = {
    IconSchema,
    IconListSchema,
    IconPaginatedSchema,
    IconDeletedSchema,
    CreateSchema  : CreateIconSchema,
    ListSchema    : ListIconsSchema,
    GetItemSchema : GetIconSchema,
    UpdateSchema  : UpdateIconSchema,
    DeleteSchema  : DeleteIconSchema
};