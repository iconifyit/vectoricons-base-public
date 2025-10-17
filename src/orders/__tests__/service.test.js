/* eslint-env jest */

const OrderEntity = require('../OrderEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initOrderService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'Order',
    initService         : initOrderService,
    Entity              : OrderEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            user_id : data.userId || data.user_id,
            cart_id : data.cartId || data.cart_id
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
