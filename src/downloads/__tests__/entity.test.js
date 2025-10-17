/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const DownloadEntity = require('../DownloadEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        userId: 1,
        entityId: testCounter,
        entityType: 'set',
        entityUniqueId: `ts${testCounter}`.padEnd(12, '0'),
        uniqueId: `tu${testCounter}`.padEnd(12, '0'),
        objectKey: `test/user1/set_${testCounter}.zip`,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => ({
    user: {
        id: 1,
        email: 'test@example.com'
    }
});

entityContract({
    name: 'Download',
    Model: DB.downloads,
    Entity: DownloadEntity,
    seedOne: seedOne,
    makeRelations: makeRelations
});
