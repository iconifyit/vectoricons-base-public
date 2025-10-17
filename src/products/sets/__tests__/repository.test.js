/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SetRepository = require('../SetRepository');
const SetEntity = require('../SetEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;
let testFamilyId = null;

beforeAll(async () => {
    // Get an existing family_id for test data
    const family = await DB.families.query().where({ is_deleted: false, is_active: true }).first();
    if (family) {
        testFamilyId = family.id;
    }
});

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Set ${testCounter}`,
        price: 19.99,
        family_id: testFamilyId || 1,
        license_id: 21,
        user_id: 1,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new SetRepository({ DB });
};

repositoryContract({
    name: 'Set',
    initRepository: initRepository,
    Entity: SetEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, family_id: data.family_id }),
    supportsRelations: false,
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'sets',
});
