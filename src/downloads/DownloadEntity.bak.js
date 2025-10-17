// Path: src/downloads/DownloadEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a download item in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class DownloadEntity extends createEntityFromModel(DB.downloads, {}, {
    relatedEntities: {
        user : () => require('../../users/UserEntity'),
    },
}) {}

module.exports = DownloadEntity;
