// Path : src/downloads/DownloadService.js
const DB                  = require('@vectoricons.net/db');
const BaseService        = require('../common/BaseService');
const DownloadsEntity     = require('./DownloadEntity');
const DownloadsRepository = require('./DownloadRepository');

/**
 * @module Downloads Domain
 * @fileoverview DownloadService - Service for managing downloads data.
 * @class DownloadService
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