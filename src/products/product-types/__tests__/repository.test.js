/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ProductTypeRepository = require('../ProductTypeRepository');
const ProductTypeEntity = require('../ProductTypeEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        value: `product_type_${testCounter}`,
        label: `Product Type ${testCounter}`,
        is_active: true,
    };
};

const initRepository = () => {
    return new ProductTypeRepository({ DB });
};

repositoryContract({
    name: 'ProductType',
    initRepository: initRepository,
    Entity: ProductTypeEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: false,
    modelName: 'productTypes',
});
