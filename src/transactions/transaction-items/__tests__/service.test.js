/* eslint-env jest */

const TransactionItemEntity = require('../TransactionItemEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initTransactionItemService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'TransactionItem',
    initService         : initTransactionItemService,
    Entity              : TransactionItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            transaction_id: data.transaction_id,
            account_id: data.account_id
        };
    },
    whereForExisting: (data) => (({
        id : data.id
    })),
    supportsRelations   : true,
    supportsSoftDelete  : false,
    supportsActivation  : false,
    supportsGetAll      : true,
    skipGetActive       : true,
});
