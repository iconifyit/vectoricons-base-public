// Path: src/downloads/index.js
const DB = require('@vectoricons.net/db');
const DownloadEntity = require('./DownloadEntity');
const DownloadRepository = require('./DownloadRepository');
const DownloadService = require('./DownloadService');

/**
 * Initializes the DownloadService with injected dependencies.
 * @returns {DownloadService}
 */
const initDownloadService = () => {
    return new DownloadService({
        repository: new DownloadRepository({ DB }),
        entityClass: DownloadEntity,
    });
};

module.exports = {
    DownloadEntity,
    DownloadRepository,
    DownloadService,
    initDownloadService,
};
