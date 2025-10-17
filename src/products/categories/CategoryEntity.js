// Path: src/products/categories/CategoryEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview CategoryEntity - Immutable category representation.
 */
class CategoryEntity extends createEntityFromModel(DB.categories, {}, {
    allowedColumns: [
        'id',
        'name',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    relatedEntities: {
        entityToCategories: () => require('../entity-to-categories/EntityToCategoriesEntity'),
    }
}) {}

module.exports = CategoryEntity;