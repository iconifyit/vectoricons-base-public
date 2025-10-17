/* eslint-env jest */

const TransactionCategoryEntity = require('../TransactionCategoryEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initTransactionCategoryService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'TransactionCategory',
    initService         : initTransactionCategoryService,
    Entity              : TransactionCategoryEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            value : data.value
        };
    },
    whereForExisting: (data) => ({
        id : data.id
    }),
    supportsRelations   : false,
    supportsSoftDelete  : false,
    supportsActivation  : false,
    supportsGetAll      : true,
    skipGetActive       : true,
});
