/* eslint-env jest */

const TransactionCategoryRepository = require('../TransactionCategoryRepository');
const TransactionCategoryEntity = require('../TransactionCategoryEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new TransactionCategoryRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'TransactionCategory',
    modelName           : 'transactionCategories',
    initRepository      : initRepository,
    Entity              : TransactionCategoryEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            value : data.value
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
