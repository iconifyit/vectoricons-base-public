// Path: src/products/entity-to-categories/EntityToCategoriesEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview EntityToCategoriesEntity - Immutable entity-to-categories representation.
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