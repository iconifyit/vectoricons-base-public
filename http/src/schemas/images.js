const enums = require('../../../src/utils/enums');

const ImageEntityTypes = Object.values(enums.ImageEntityTypes) || [];
const ImageAccessTypes = Object.values(enums.ImageAccessTypes) || [];
const ImageVisibilityTypes = Object.values(enums.ImageVisibilityTypes) || [];
const ImageFileTypes = Object.values(enums.ImageFileTypes) || [];

/**
 * @typedef {Object} ImageSchema
 * @property {number} id
 * @property {number} entityId
 * @property {string} entityType
 * @property {number} imageTypeId
 * @property {string} imageHash
 * @property {string} visibility
 * @property {string} access
 * @property {string} name
 * @property {string} fileType
 * @property {string} url
 * @property {string} uniqueId
 * @property {string} createdAt (date-time)
 * @property {string} updatedAt (date-time)
 * @property {boolean} isDeleted
 */
const ImageSchema = {
    type: 'object',
    properties: {
        id         : { type: 'integer' },
        entityId   : { type: 'integer' },
        entityType : { type: 'string', enum: ImageEntityTypes },
        imageTypeId: { type: 'integer' },
        imageHash  : { type: 'string' },
        visibility : { type: 'string', enum: ImageVisibilityTypes },
        access     : { type: 'string', enum: ImageAccessTypes },
        name       : { type: 'string', maxLength: 255 },
        fileType   : { type: 'string', enum: ImageFileTypes },
        url        : { type: 'string' },
        uniqueId   : { type: 'string' },
        createdAt  : { type: 'string', format: 'date-time' },
        updatedAt  : { type: 'string', format: 'date-time' },
        isDeleted  : { type: 'boolean' }
    },
    required: [
        'entityId',
        'entityType',
        'imageTypeId',
        'imageHash',
        'visibility',
        'access',
        'name',
        'fileType',
        'url',
        'uniqueId',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    additionalProperties: false
};

/**
 * @typedef {Object} ImageListSchema
 * @property {ImageSchema[]} results
 */
const ImageListSchema = {
    type: 'array',
    items: ImageSchema
};

/**
 * @typedef {Object} ImagePaginatedSchema
 * @property {ImageSchema[]} results
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {boolean} cacheHit
 */
const ImagePaginatedSchema = {
    type: 'object',
    properties: {
        results    : ImageListSchema,
        total      : { type: 'integer' },
        page       : { type: 'integer' },
        pageSize   : { type: 'integer' },
        totalPages : { type: 'integer' },
        cacheHit   : { type: 'boolean' }
    },
    required: ['results', 'total', 'page', 'pageSize', 'totalPages'],
    additionalProperties: false
};

/** @typedef {Object} ImageDeletedSchema
 * @property {boolean} deleted
 */
const ImageDeletedSchema = {
    type: 'object',
    properties: { deleted: { type: 'boolean' } },
    required: ['deleted'],
    additionalProperties: false
};

/**
 * @typedef {Object} CreateImageSchema
 * @property {number} entityId
 * @property {string} entityType
 * @property {number} imageTypeId
 * @property {string} imageHash
 * @property {string} visibility
 * @property {string} access
 * @property {string} name
 * @property {string} fileType
 * @property {string} url
 * @property {string} uniqueId
 */
const CreateImageSchema = {
    body: {
        type: 'object',
        properties: {
            entityId   : { type: 'integer' },
            entityType : { type: 'string', enum: ImageEntityTypes },
            imageTypeId: { type: 'integer' },
            imageHash  : { type: 'string' },
            visibility : { type: 'string', enum: ImageVisibilityTypes },
            access     : { type: 'string', enum: ImageAccessTypes },
            name       : { type: 'string', maxLength: 255 },
            fileType   : { type: 'string', enum: ImageFileTypes },
            url        : { type: 'string' },
            uniqueId   : { type: 'string' }
        },
        required: [
            'entityId',
            'entityType',
            'imageTypeId',
            'imageHash',
            'visibility',
            'access',
            'name',
            'fileType',
            'url',
            'uniqueId'
        ],
        additionalProperties: false
    },
    response: { 201: ImageSchema }
};

/**
 * @typedef {Object} ListImagesSchema
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {string} [entityType]
 * @property {number} [entityId]
 * @property {boolean} [isDeleted]
 * @property {ImageSchema[]} 200
 */
const ListImagesSchema = {
    params: {
        type: 'object',
        properties: {
            page     : { type: 'integer', minimum: 1, default: 1 },
            pageSize : { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            entityId : { type: 'integer' },
            entityType: { type: 'string', enum: ImageEntityTypes },
            isDeleted: { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: ImageSchema
        }
    }
};

/**
 * @typedef {Object} GetImageSchema
 * @property {number} id
 * @property {ImageSchema} 200
 * @property {Object} 404
 */
const GetImageSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: ImageSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const UpdateImageSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    body: {
        type: 'object',
        properties: {
            entityId   : { type: 'integer' },
            entityType : { type: 'string', enum: ImageEntityTypes },
            imageTypeId: { type: 'integer' },
            imageHash  : { type: 'string' },
            visibility : { type: 'string', enum: ImageVisibilityTypes },
            access     : { type: 'string', enum: ImageAccessTypes },
            name       : { type: 'string', maxLength: 255 },
            fileType   : { type: 'string', enum: ImageFileTypes },
            url        : { type: 'string' },
            uniqueId   : { type: 'string' },
            isDeleted  : { type: 'boolean' }
        },
        additionalProperties: false
    },
    response: {
        200: ImageSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

const DeleteImageSchema = {
    params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false
    },
    response: {
        200: ImageDeletedSchema,
        404: {
            type: 'object',
            properties: { error: { type: 'string' } }
        }
    }
};

module.exports = {
    ImageSchema,
    ImageListSchema,
    ImagePaginatedSchema,
    ImageDeletedSchema,
    CreateSchema  : CreateImageSchema,
    ListSchema    : ListImagesSchema,
    GetItemSchema : GetImageSchema,
    UpdateSchema  : UpdateImageSchema,
    DeleteSchema  : DeleteImageSchema
};