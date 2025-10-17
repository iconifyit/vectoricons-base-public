/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const CategoryRepository = require('../CategoryRepository');
const CategoryEntity = require('../CategoryEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Category ${testCounter}`,
        is_active: true,
    };
};

const initRepository = () => {
    return new CategoryRepository({ DB });
};

repositoryContract({
    name: 'Category',
    initRepository: initRepository,
    Entity: CategoryEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'categories',
});
