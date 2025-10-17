const BaseRepository   = require('../common/BaseRepository');
const { Downloads }    = require('@vectoricons.net/db');
const DownloadsEntity  = require('./DownloadEntity');

/**
 * @module Downloads Domain
 * @fileoverview DownloadsRepository - Provides DB operations for downloads.
 */
class DownloadsRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'downloads',
            entityClass: DownloadsEntity,
        });
    }
}

module.exports = DownloadsRepository;