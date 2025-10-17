/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const StyleEntity = require('../StyleEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        value: `style_value_${testCounter}`,
        label: `Style Label ${testCounter}`,
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
                typeId: 1,
                styleId: testCounter,
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
        icons: [
            {
                id: testCounter,
                name: `Test Icon ${testCounter}`,
                price: 9.99,
                width: 24,
                height: 24,
                setId: 1,
                styleId: testCounter,
                teamId: 1,
                licenseId: 21,
                isActive: true,
                uniqueId: `icon${testCounter}`,
                colorData: null,
                isDeleted: false,
                userId: 1,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            },
        ],
        illustrations: [
            {
                id: testCounter,
                name: `Test Illustration ${testCounter}`,
                price: 19.99,
                width: 1024,
                height: 1024,
                setId: 1,
                styleId: testCounter,
                teamId: 1,
                licenseId: 21,
                isActive: true,
                uniqueId: `illus${testCounter}`,
                colorData: null,
                isDeleted: false,
                userId: 1,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            },
        ],
    };
};

entityContract({
    name: 'Style',
    Model: DB.styles,
    Entity: StyleEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
