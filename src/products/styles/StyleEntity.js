// Path: src/products/styles/StyleEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview StyleEntity - Immutable style representation.
 */
class StyleEntity extends createEntityFromModel(DB.styles, {}, {
    allowedColumns: [
        'id',
        'value',
        'label'
    ],
    relatedEntities: {
        sets          : () => require('../sets/SetEntity'),
        icons         : () => require('../icons/IconEntity'),
        illustrations : () => require('../illustrations/IllustrationEntity'),
    },
}) {}

module.exports = StyleEntity;