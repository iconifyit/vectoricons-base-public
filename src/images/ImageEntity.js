// Path: src/images/ImageEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents an image item in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class ImageEntity extends createEntityFromModel(DB.images, {}, {
    allowedColumns: [
        'id',
        'entity_id',
        'entity_type',
        'image_type_id',
        'image_hash',
        'visibility',
        'access',
        'name',
        'file_type',
        'url',
        'unique_id',
        'color_data',
        'object_key',
        'is_active',
        'is_deleted',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        imageTypes: () => require('./image-types/ImageTypeEntity'),
    },
}) {}

module.exports = ImageEntity;