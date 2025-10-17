// Path: src/products/product-types/ProductTypeEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a product-type item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/product-types.js} Objection.js model for product-types
 */
class ProductTypeEntity extends createEntityFromModel(DB.productTypes, {}, {
    allowedColumns: [
        'id',
        'value',
        'label',
        'isActive'
    ],
    relatedEntities: {
        sets: () => require('../../products/sets/SetEntity'),
    },
}) {}

module.exports = ProductTypeEntity;