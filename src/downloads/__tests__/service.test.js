/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const DownloadService = require('../DownloadService');
const DownloadEntity = require('../DownloadEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne } = require('./seed');

const initService = () => {
    return new DownloadService();
};

// Contract tests
serviceContract({
    name: 'Download',
    initService: initService,
    Entity: DownloadEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ entity_unique_id: data.entity_unique_id }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
});
