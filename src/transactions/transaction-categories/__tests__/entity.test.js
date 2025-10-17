/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TransactionCategoryEntity = require('../TransactionCategoryEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        value: `purchase_${testCounter}`,
        label: `Purchase ${testCounter}`,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    return {};
};

const updateOne = (entity) => {
    return {
        label: entity.label + ' updated',
    };
};

entityContract({
    name: 'TransactionCategory',
    Model: DB.transactionCategories,
    Entity: TransactionCategoryEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
