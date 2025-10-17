const BaseRepository   = require('../common/BaseRepository');
const { Downloads }    = require('@vectoricons.net/db');
const DownloadsEntity  = require('./DownloadEntity');

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