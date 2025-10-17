// Path: src/products/tags/TagEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview EntityToTagsEntity - Immutable entity-to-tags representation.
 */
class EntityToTagsEntity extends createEntityFromModel(DB.entityToTags, {}, {
    allowedColumns: [
        'id',
        'entityId',
        'entityType',
        'tagId',
        'createdAt',
        'updatedAt'
    ],
    relatedEntities: {
        tag: () => require('../tags/TagEntity'),
    },
}) {}

module.exports = EntityToTagsEntity;