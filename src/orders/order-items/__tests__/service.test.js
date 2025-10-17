/* eslint-env jest */

const OrderItemEntity = require('../OrderItemEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initOrderItemService } = require('../index');

// Run contract tests
serviceContract({
    name                : 'OrderItem',
    initService         : initOrderItemService,
    Entity              : OrderItemEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique: (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            order_id   : data.orderId || data.order_id,
            entity_id  : data.entityId || data.entity_id,
            entity_type: data.entityType || data.entity_type
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
