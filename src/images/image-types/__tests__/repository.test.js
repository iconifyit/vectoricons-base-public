/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ImageTypeRepository = require('../ImageTypeRepository');
const ImageTypeEntity = require('../ImageTypeEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        label: `Test Image Type ${testCounter}`,
        value: `test_type_${testCounter}`,
        description: `Description for test type ${testCounter}`,
    };
};

const initRepository = () => {
    return new ImageTypeRepository({ DB });
};

repositoryContract({
    name: 'ImageType',
    initRepository: initRepository,
    Entity: ImageTypeEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
    modelName: 'imageTypes',
});
