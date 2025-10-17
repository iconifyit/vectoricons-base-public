const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Images Domain
 * @fileoverview ImageTypeEntity - Immutable image type representation.
 */
class ImageTypeEntity extends createEntityFromModel(DB.imageTypes, {}, {
    allowedColumns: [
        'id',
        'label',
        'value',
        'description',
        'created_at',
        'updated_at'
    ]
}) {}

module.exports = ImageTypeEntity;