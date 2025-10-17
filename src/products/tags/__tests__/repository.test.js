/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TagRepository = require('../TagRepository');
const TagEntity = require('../TagEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Tag ${testCounter}`,
        is_active: true,
    };
};

const initRepository = () => {
    return new TagRepository({ DB });
};

repositoryContract({
    name: 'Tag',
    initRepository: initRepository,
    Entity: TagEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'tags',
});
