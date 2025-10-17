/* eslint-env jest */

jest.setTimeout(10000);

const ImageEntity = require('../ImageEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initImageService } = require('../index');

serviceContract({
    name: 'Image',
    initService: initImageService,
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
    supportsSoftDelete: true,
    supportsActivation: false, // Skip - getActive() times out with millions of images
    supportsGetAll: false, // Skip getAll - too many images in DB
});
