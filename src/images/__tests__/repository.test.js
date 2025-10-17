/* eslint-env jest */

jest.setTimeout(10000);

const DB = require('@vectoricons.net/db');
const ImageRepository = require('../ImageRepository');
const ImageEntity = require('../ImageEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');

const initRepository = () => {
    return new ImageRepository({ DB });
};

repositoryContract({
    name: 'Image',
    modelName: 'images',
    initRepository: initRepository,
    Entity: ImageEntity,
    seedOne: seedOne,
    seedMany: seedMany,
    whereForUnique: (data) => {
        return {
            unique_id: data.unique_id || data.uniqueId,
        };
    },
    whereForExisting: (data) => {
        return {
            unique_id: data.unique_id || data.uniqueId,
        };
    },
    supportsRelations: true,
    relationGraph: '[imageTypes]',
    supportsFindAll: false, // Skip findAll - too many images in DB
    supportsPaginate: false, // Skip paginate - too many images in DB
    supportsExists: true,
});
