const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents image type metadata in the system.
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