/* eslint-env jest */

const OrderRepository = require('../OrderRepository');
const OrderEntity = require('../OrderEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new OrderRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'Order',
    modelName           : 'orders',
    initRepository      : initRepository,
    Entity              : OrderEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            user_id : data.userId || data.user_id,
            cart_id : data.cartId || data.cart_id
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    relationGraph: '[invoices, user, transactions, carts, orderItems]',
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
