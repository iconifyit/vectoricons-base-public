/* eslint-env jest */

const OrderItemRepository = require('../OrderItemRepository');
const OrderItemEntity = require('../OrderItemEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new OrderItemRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'OrderItem',
    modelName           : 'orderItems',
    initRepository      : initRepository,
    Entity              : OrderItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            order_id   : data.orderId || data.order_id,
            entity_id  : data.entityId || data.entity_id,
            entity_type: data.entityType || data.entity_type
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    relationGraph: '[order, transactionItem, cartItem]',
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
