/* eslint-env jest */

const TransactionTypeEntity = require('../TransactionTypeEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initTransactionTypeService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'TransactionType',
    initService         : initTransactionTypeService,
    Entity              : TransactionTypeEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            label : data.label
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
