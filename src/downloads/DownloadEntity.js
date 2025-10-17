// Path: src/downloads/DownloadEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Downloads Domain
 * @fileoverview DownloadEntity - Immutable download representation.
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
