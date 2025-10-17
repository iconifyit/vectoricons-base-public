// Path: src/products/product-types/ProductTypeEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview ProductTypeEntity - Immutable product-type representation.
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