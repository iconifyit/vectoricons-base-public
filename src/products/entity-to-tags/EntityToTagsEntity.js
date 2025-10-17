// Path: src/products/tags/TagEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a enitity-to-tags item in the system.
 * Extends BaseEntity to include common entity functionality.
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