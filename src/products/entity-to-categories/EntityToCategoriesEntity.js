// Path: src/products/entity-to-categories/EntityToCategoriesEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a enitity-to-categories item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/entity-to-categories.js} Objection.js model for entity-to-categories
 */
class EntityToCategoriesEntity extends createEntityFromModel(DB.entityToCategories, {}, {
        allowedColumns: [
            'id',
            'entityId',
            'entityType',
            'categoryId',
            'createdAt',
            'updatedAt'
        ],
        relatedEntities: {
            category: () => require('../categories/CategoryEntity'),
        },
}) {}

module.exports = EntityToCategoriesEntity;