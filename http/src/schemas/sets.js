/**
 * @typedef {Object} SetSchema
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {number} familyId
 * @property {number} licenseId
 * @property {number} typeId
 * @property {number} styleId
 * @property {number} teamId
 * @property {string} uniqueId
 * @property {number} userId
 * @property {string} description
 * @property {number} sort
 * @property {boolean} isActive
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 * @property {boolean} isDeleted
 */
const SetSchema = {
    type: 'object',
    properties: {
        id          : { type: 'integer' },
        name        : { type: 'string', maxLength: 255 },
        price       : { type: 'number' },
        familyId    : { type: 'integer' },
        licenseId   : { type: 'integer' },
        typeId      : { type: 'integer' },
        styleId     : { type: 'integer' },
        teamId      : { type: 'integer' },
        uniqueId    : { type: 'string' },
        userId      : { type: 'integer' },
        description : { type: 'string' },
        sort        : { type: 'integer' },
        isActive    : { type: 'boolean' },
        createdAt   : { type: 'string', format: 'date-time' },
        updatedAt   : { type: 'string', format: 'date-time' },
        isDeleted   : { type: 'boolean' }
    },
    required: [
        'name',
        'price',
        'familyId',
        'licenseId',
        'typeId',
        'styleId',
        'teamId',
        'uniqueId',
        'userId',
        'description',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    additionalProperties: false
};

/**
 * @typedef {Object} SetListSchema
 * @property {SetSchema[]} results
 */
const SetListSchema = {
    type: 'array',
    items: SetSchema
};

/**
 * @typedef {Object} SetPaginatedSchema
 * @property {SetSchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} cacheHit
 */
const SetPaginatedSchema = {
    type: 'object',
    properties: {
        results    : SetListSchema,
        total      : { type: 'integer' },
        page       : { type: 'integer' },
        pageSize   : { type: 'integer' },
        totalPages : { type: 'integer' },
        cacheHit   : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** @typedef {Object} SetDeletedSchema
 * @property {boolean} deleted
 */
const SetDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateSetSchema
 * @property {string} name
 * @property {number} price
 * @property {number} familyId
 * @property {number} licenseId
 * @property {number} typeId
 * @property {number} styleId
 * @property {number} teamId
 * @property {string} uniqueId
 * @property {number} userId
 * @property {string} description
 * @property {number} sort
 * @property {boolean} isActive
 */
const CreateSetSchema = {
    body: {
        type: 'object',
        properties: {
            name        : { type: 'string', maxLength: 255 },
            price       : { type: 'number' },
            familyId    : { type: 'integer' },
            licenseId   : { type: 'integer' },
            typeId      : { type: 'integer' },
            styleId     : { type: 'integer' },
            teamId      : { type: 'integer' },
            uniqueId    : { type: 'string' },
            userId      : { type: 'integer' },
            description : { type: 'string' },
            sort        : { type: 'integer' },
            isActive    : { type: 'boolean' }
        },
        required: [
            'name',
            'price',
            'familyId',
            'licenseId',
            'typeId',
            'styleId',
            'teamId',
            'uniqueId',
            'userId',
            'description',
            'sort',
            'isActive'
        ],
        additionalProperties: false
    },
    response: { 201: SetSchema }
};

/**
 * @typedef {Object} ListSetsSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {number} [familyId]
 * @property {boolean} [isActive]
 * @property {SetSchema[]} 200
 */
const ListSetsSchema = {
    params: {
        type: 'object',
        properties: {
            page     : { type: 'integer', minimum: 1, default: 1 },
            pageSize : { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            familyId : { type: 'integer' },
            isActive : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: SetSchema
        }
    }
};

/**
 * @typedef {Object} GetSetSchema
 * @property {number} id
 * @property {SetSchema} 200
 * @property {Object} 404
 */
const GetSetSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: SetSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const UpdateSetSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    body: {
        type: 'object',
        properties: {
            name        : { type: 'string', maxLength: 255 },
            price       : { type: 'number' },
            familyId    : { type: 'integer' },
            licenseId   : { type: 'integer' },
            typeId      : { type: 'integer' },
            styleId     : { type: 'integer' },
            teamId      : { type: 'integer' },
            uniqueId    : { type: 'string' },
            userId      : { type: 'integer' },
            description : { type: 'string' },
            sort        : { type: 'integer' },
            isActive    : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: SetSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const DeleteSetSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: SetDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

module.exports = {
    SetSchema,
    SetListSchema,
    SetPaginatedSchema,
    SetDeletedSchema,
    CreateSchema  : CreateSetSchema,
    ListSchema    : ListSetsSchema,
    GetItemSchema : GetSetSchema,
    UpdateSchema  : UpdateSetSchema,
    DeleteSchema  : DeleteSetSchema
};