/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const EntityToCategoriesEntity = require('../EntityToCategoriesEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualCategory = null;

beforeAll(async () => {
    // Fetch first available category for relation tests
    const category = await DB.categories.query().where({ is_active: true }).first();
    if (category) {
        actualCategory = {
            id: category.id,
            name: category.name,
            description: category.description,
            uniqueId: category.unique_id,
            isActive: category.is_active,
            createdAt: category.created_at,
            updatedAt: category.updated_at,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        entityId: 100 + testCounter,
        entityType: 'icon',
        categoryId: actualCategory?.id || 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        category: actualCategory || {
            id: 1,
            name: 'Test Category',
            description: 'Test category description',
            uniqueId: 'test-cat',
            isActive: true,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
    };
};

entityContract({
    name: 'EntityToCategories',
    Model: DB.entityToCategories,
    Entity: EntityToCategoriesEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
