// Path: src/products/tags/TagEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a enitity-to-tags item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/entity-to-tags.js} Objection.js model for entity-to-tags
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