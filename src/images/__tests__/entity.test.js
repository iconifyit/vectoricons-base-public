/* eslint-env jest */

jest.setTimeout(10000);

const DB = require('@vectoricons.net/db');
const ImageEntity = require('../ImageEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');
const { seedEntity } = require('./seed');

const makeRelations = () => {
    return {
        imageTypes: {
            id: 1,
            label: 'Test Image Type',
            value: 'test-type',
            description: 'Test image type for testing',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
    };
};

const updateOne = (entity) => {
    return {
        name: 'updated-image.png',
        url: 'https://example.com/updated.png',
    };
};

entityContract({
    name: 'Image',
    Model: DB.images,
    Entity: ImageEntity,
    seedOne: seedEntity,
    makeRelations: makeRelations,
    updateOne: updateOne,
    hiddenFields: [],
});
