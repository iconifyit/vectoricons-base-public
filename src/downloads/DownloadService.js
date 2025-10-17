// Path : src/downloads/DownloadService.js
const DB                  = require('@vectoricons.net/db');
const BaseService        = require('../common/BaseService');
const DownloadsEntity     = require('./DownloadEntity');
const DownloadsRepository = require('./DownloadRepository');

/**
 * DownloadService class
 * @class DownloadService
 * @description This class is responsible for managing downloads data.
 */
class DownloadService extends BaseService {
    constructor({
        downloadsRepository = new DownloadsRepository({ DB }),
        entityClass = DownloadsEntity,
    } = {}) {
        super({ repository: downloadsRepository, entityClass });
    }
}

module.exports = DownloadService;