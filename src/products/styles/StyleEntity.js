// Path: src/products/styles/StyleEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a style item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/styles.js} Objection.js model for styles
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