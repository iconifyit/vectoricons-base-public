const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents an image entity in the system.
 * @see {@link ../../../refs/db-models/images.js}
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