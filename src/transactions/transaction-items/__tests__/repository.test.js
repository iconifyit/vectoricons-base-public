/* eslint-env jest */

const TransactionItemRepository = require('../TransactionItemRepository');
const TransactionItemEntity = require('../TransactionItemEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new TransactionItemRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'TransactionItem',
    modelName           : 'transactionItems',
    initRepository      : initRepository,
    Entity              : TransactionItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            transaction_id: data.transaction_id,
            account_id: data.account_id
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    relationGraph: '[transaction, orderItem, account, paymentType, transactionType]',
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
