/* eslint-env jest */

const TransactionTypeRepository = require('../TransactionTypeRepository');
const TransactionTypeEntity = require('../TransactionTypeEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new TransactionTypeRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'TransactionType',
    modelName           : 'transactionTypes',
    initRepository      : initRepository,
    Entity              : TransactionTypeEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            label : data.label
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: false,
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
