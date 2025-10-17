/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TransactionTypeEntity = require('../TransactionTypeEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    const isCredit = testCounter % 2 === 1;
    return {
        id: testCounter,
        label: isCredit ? 'credit' : 'debit',
        operation: isCredit ? 1 : -1,
    };
};

const makeRelations = () => {
    return {};
};

const updateOne = (entity) => {
    return {
        operation: entity.operation * -1,
    };
};

entityContract({
    name: 'TransactionType',
    Model: DB.transactionTypes,
    Entity: TransactionTypeEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
