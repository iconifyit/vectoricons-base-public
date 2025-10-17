/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const StyleRepository = require('../StyleRepository');
const StyleEntity = require('../StyleEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        value: `style_value_${testCounter}`,
        label: `Style Label ${testCounter}`,
    };
};

const initRepository = () => {
    return new StyleRepository({ DB });
};

repositoryContract({
    name: 'Style',
    initRepository: initRepository,
    Entity: StyleEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: false,
    modelName: 'styles',
});
