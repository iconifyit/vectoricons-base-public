/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TagEntity = require('../TagEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        name: `Tag ${testCounter}`,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        entityToTags: [
            {
                id: testCounter,
                entityId: testCounter,
                entityType: 'icon',
                tagId: testCounter,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            },
        ],
    };
};

entityContract({
    name: 'Tag',
    Model: DB.tags,
    Entity: TagEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
