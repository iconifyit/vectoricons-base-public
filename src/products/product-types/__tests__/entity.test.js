/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ProductTypeEntity = require('../ProductTypeEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        value: `product_type_${testCounter}`,
        label: `Product Type ${testCounter}`,
        isActive: true,
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        sets: [
            {
                id: testCounter,
                name: `Test Set ${testCounter}`,
                price: 99.99,
                familyId: 1,
                licenseId: 21,
                typeId: testCounter,
                styleId: 1,
                teamId: 1,
                sort: 0,
                isActive: true,
                uniqueId: `set${testCounter}`,
                description: 'Test set',
                isDeleted: false,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            },
        ],
    };
};

entityContract({
    name: 'ProductType',
    Model: DB.productTypes,
    Entity: ProductTypeEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
