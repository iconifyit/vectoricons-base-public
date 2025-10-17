/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const DownloadRepository = require('../DownloadRepository');
const DownloadEntity = require('../DownloadEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne } = require('./seed');

const initRepository = () => {
    return new DownloadRepository({ DB });
};

// Contract tests
repositoryContract({
    name: 'Download',
    initRepository: initRepository,
    Entity: DownloadEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ entity_unique_id: data.entity_unique_id }),
    supportsRelations: true,
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
    modelName: 'downloads',
});
