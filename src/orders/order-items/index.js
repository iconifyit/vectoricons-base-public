const DB = require('@vectoricons.net/db');

const OrderItemEntity = require('./OrderItemEntity.js');
const OrderItemRepository = require('./OrderItemRepository.js');
const OrderItemService = require('./OrderItemService.js');

const initOrderItemService = () => {
    return new OrderItemService({
        repository: new OrderItemRepository({ DB }),
        entityClass: OrderItemEntity,
    });
};

module.exports.initOrderItemService = initOrderItemService;