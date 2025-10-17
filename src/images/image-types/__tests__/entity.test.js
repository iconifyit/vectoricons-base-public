/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ImageTypeEntity = require('../ImageTypeEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        label: `Test Image Type ${testCounter}`,
        value: `test_type_${testCounter}`,
        description: `Description for test type ${testCounter}`,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

entityContract({
    name: 'ImageType',
    Model: DB.imageTypes,
    Entity: ImageTypeEntity,
    seedOne: seedOne,
});
