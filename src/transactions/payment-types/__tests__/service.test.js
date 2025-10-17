/* eslint-env jest */

const PaymentTypeEntity = require('../PaymentTypeEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initPaymentTypeService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'PaymentType',
    initService         : initPaymentTypeService,
    Entity              : PaymentTypeEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            type : data.type
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
