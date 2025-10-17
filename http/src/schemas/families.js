/**
 * @typedef {Object} FamilySchema
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {number} licenseId
 * @property {number} teamId
 * @property {string} uniqueId
 * @property {number} userId
 * @property {number} sort
 * @property {boolean} isActive
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 * @property {boolean} isDeleted
 */
const FamilySchema = {
    type: 'object',
    properties: {
        id         : { type: 'integer' },
        name       : { type: 'string' },
        price      : { type: 'number' },
        description: { type: 'string' },
        licenseId  : { type: 'integer' },
        teamId     : { type: 'integer' },
        uniqueId   : { type: 'string' },
        userId     : { type: 'integer' },
        sort       : { type: 'integer' },
        isActive   : { type: 'boolean' },
        createdAt  : { type: 'string', format: 'date-time' },
        updatedAt  : { type: 'string', format: 'date-time' },
        isDeleted  : { type: 'boolean' }
    },
    required: [
        'name',
        'price',
        'description',
        'licenseId',
        'teamId',
        'uniqueId',
        'userId',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    additionalProperties: false
};

/**
 * @typedef {Object} FamilyListSchema
 * @property {FamilySchema[]} results
 */
const FamilyListSchema = {
    type: 'array',
    items: FamilySchema
};

/**
 * @typedef {Object} FamilyPaginatedSchema
 * @property {FamilySchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} cacheHit
 */
const FamilyPaginatedSchema = {
    type: 'object',
    properties: {
        results    : FamilyListSchema,
        total      : { type: 'integer' },
        page       : { type: 'integer' },
        pageSize   : { type: 'integer' },
        totalPages : { type: 'integer' },
        cacheHit   : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** @typedef {Object} FamilyDeletedSchema
 * @property {boolean} deleted
 */
const FamilyDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateFamilySchema
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {number} licenseId
 * @property {number} teamId
 * @property {string} uniqueId
 * @property {number} userId
 * @property {number} sort
 * @property {boolean} isActive
 */
const CreateFamilySchema = {
    body: {
        type: 'object',
        properties: {
            name       : { type: 'string', minLength: 1, maxLength: 255 },
            price      : { type: 'number' },
            description: { type: 'string', minLength: 0, maxLength: 2000 },
            licenseId  : { type: 'integer' },
            teamId     : { type: 'integer' },
            uniqueId   : { type: 'string' },
            userId     : { type: 'integer' },
            sort       : { type: 'integer' },
            isActive   : { type: 'boolean' }
        },
        required: [
            'name',
            'price',
            'description',
            'licenseId',
            'teamId',
            'uniqueId',
            'userId',
            'sort',
            'isActive'
        ],
        additionalProperties: false
    },
    response: { 201: FamilySchema }
};

/**
 * @typedef {Object} ListFamiliesSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {number} [userId]
 * @property {number} [teamId]
 * @property {number} [licenseId]
 * @property {boolean} [isActive]
 * @property {boolean} [isDeleted]
 * @property {FamilySchema[]} 200
 */
const ListFamiliesSchema = {
    params: {
        type: 'object',
        properties: {
            page     : { type: 'integer', minimum: 1, default: 1 },
            pageSize : { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            userId   : { type: 'integer' },
            teamId   : { type: 'integer' },
            licenseId: { type: 'integer' },
            isActive : { type: 'boolean' },
            isDeleted: { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: FamilySchema
        }
    }
};

/**
 * @typedef {Object} GetFamilySchema
 * @property {number} id
 * @property {FamilySchema} 200
 * @property {Object} 404
 */
const GetFamilySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: FamilySchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const UpdateFamilySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    body: {
        type: 'object',
        properties: {
            name       : { type: 'string', minLength: 1, maxLength: 255 },
            price      : { type: 'number' },
            description: { type: 'string', minLength: 0, maxLength: 2000 },
            licenseId  : { type: 'integer' },
            teamId     : { type: 'integer' },
            uniqueId   : { type: 'string' },
            userId     : { type: 'integer' },
            sort       : { type: 'integer' },
            isActive   : { type: 'boolean' },
            isDeleted  : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: FamilySchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const DeleteFamilySchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: FamilyDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

module.exports = {
    FamilySchema,
    FamilyListSchema,
    FamilyPaginatedSchema,
    FamilyDeletedSchema,
    CreateSchema  : CreateFamilySchema,
    ListSchema    : ListFamiliesSchema,
    GetItemSchema : GetFamilySchema,
    UpdateSchema  : UpdateFamilySchema,
    DeleteSchema  : DeleteFamilySchema
};