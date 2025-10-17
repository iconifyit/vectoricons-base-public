/* eslint-env jest */

const CartItemEntity = require('../CartItemEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initCartItemService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'CartItem',
    initService         : initCartItemService,
    Entity              : CartItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) { return { id: data.id } }
        return {
            cart_id    : data.cartId || data.cart_id,
            entity_id  : data.entityId || data.entity_id,
            entity_type: data.entityType || data.entity_type
        };
    },
    whereForExisting: (data) => ({ id : data.id }),
    supportsRelations   : true,
    supportsSoftDelete  : false,
    supportsActivation  : false,
    supportsGetAll      : true,
    skipGetActive       : true,
});
