/* eslint-env jest */

const TransactionEntity = require('../TransactionEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initTransactionService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'Transaction',
    initService         : initTransactionService,
    Entity              : TransactionEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            uuid : data.uuid
        };
    },
    whereForExisting: (data) => ({
        id : data.id
    }),
    supportsRelations   : true,
    supportsSoftDelete  : false,
    supportsActivation  : false,
    supportsGetAll      : true,
    skipGetActive       : true,
});
