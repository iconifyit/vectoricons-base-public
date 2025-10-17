/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IllustrationRepository = require('../IllustrationRepository');
const IllustrationEntity = require('../IllustrationEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;
let testSetId = null;

beforeAll(async () => {
    // Get an existing set_id for test data
    const set = await DB.sets.query().where({ is_deleted: false, is_active: true }).first();
    if (set) {
        testSetId = set.id;
    }
});

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Illustration ${testCounter}`,
        width: 512,
        height: 512,
        set_id: testSetId || 1,
        license_id: 21,
        user_id: 1,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new IllustrationRepository({ DB });
};

repositoryContract({
    name: 'Illustration',
    initRepository: initRepository,
    Entity: IllustrationEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, set_id: data.set_id }),
    supportsRelations: false,
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'illustrations',
});
