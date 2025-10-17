// Path: src/downloads/DownloadEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a download item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/downloads.js} Objection.js model for downloads
 */
class DownloadEntity extends createEntityFromModel(DB.downloads, {}, {
    allowedColumns: [
        'id',
        'user_id',
        'entity_id',
        'entity_type',
        'entity_unique_id',
        'unique_id',
        'object_key',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        user : () => require('../users/UserEntity'),
    },
}) {}

module.exports = DownloadEntity;
