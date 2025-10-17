/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const FamilyRepository = require('../FamilyRepository');
const FamilyEntity = require('../FamilyEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Family ${testCounter}`,
        price: 29.99,
        description: `Test family ${testCounter}`,
        license_id: 21,
        user_id: 1,
        sort: 0,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new FamilyRepository({ DB });
};

repositoryContract({
    name: 'Family',
    initRepository: initRepository,
    Entity: FamilyEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, user_id: data.user_id }),
    supportsRelations: false,
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'families',
});
