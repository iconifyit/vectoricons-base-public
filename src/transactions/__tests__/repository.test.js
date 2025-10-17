/* eslint-env jest */

const TransactionRepository = require('../TransactionRepository');
const TransactionEntity = require('../TransactionEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');
const DB = require('@vectoricons.net/db');


const initRepository = () => {
    return new TransactionRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'Transaction',
    modelName           : 'transactions',
    initRepository      : initRepository,
    Entity              : TransactionEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            uuid : data.uuid
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    relationGraph: '[transactionItems, order, paymentType, transactionCategory]',
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
