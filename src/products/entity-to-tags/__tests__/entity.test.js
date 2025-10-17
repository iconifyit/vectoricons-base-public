/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const EntityToTagsEntity = require('../EntityToTagsEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualTag = null;

beforeAll(async () => {
    // Fetch first available tag for relation tests
    const tag = await DB.tags.query().where({ is_active: true }).first();
    if (tag) {
        actualTag = {
            id: tag.id,
            name: tag.name,
            isActive: tag.is_active,
            createdAt: tag.created_at,
            updatedAt: tag.updated_at,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        entityId: 100 + testCounter,
        entityType: 'icon',
        tagId: actualTag?.id || 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        tag: actualTag || {
            id: 1,
            name: 'Test Tag',
            isActive: true,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
    };
};

entityContract({
    name: 'EntityToTags',
    Model: DB.entityToTags,
    Entity: EntityToTagsEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
