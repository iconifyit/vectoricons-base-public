/* eslint-env jest */

const CartItemRepository = require('../CartItemRepository');
const CartItemEntity = require('../CartItemEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new CartItemRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'CartItem',
    modelName           : 'cartItems',
    initRepository      : initRepository,
    Entity              : CartItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            cart_id    : data.cartId || data.cart_id,
            entity_id  : data.entityId || data.entity_id,
            entity_type: data.entityType || data.entity_type
        };
    },
    whereForExisting : (data) => {
        return { id : data.id };
    },
    supportsRelations: true,
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
