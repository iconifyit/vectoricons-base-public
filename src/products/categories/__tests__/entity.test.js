/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const CategoryEntity = require('../CategoryEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        name: `Category ${testCounter}`,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        entityToCategories: [
            {
                id: testCounter,
                entityId: testCounter,
                entityType: 'icon',
                categoryId: testCounter,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            },
        ],
    };
};

entityContract({
    name: 'Category',
    Model: DB.categories,
    Entity: CategoryEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
