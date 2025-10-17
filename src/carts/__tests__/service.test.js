/* eslint-env jest */

const CartEntity = require('../CartEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initCartService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'Cart',
    initService         : initCartService,
    Entity              : CartEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            user_id : data.userId || data.user_id,
            status  : data.status
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
