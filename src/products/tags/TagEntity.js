// Path: src/products/tags/TagEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a tag item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/tags.js} Objection.js model for tags
 */
class TagEntity extends createEntityFromModel(DB.tags, {}, {
    allowedColumns: [
        'id',
        'name',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    relatedEntities: {
        entityToTags: () => require('../entity-to-tags/EntityToTagsEntity'),
    }
}) {}

module.exports = TagEntity;