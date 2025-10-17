module.exports.OrderEntity = require('./OrderEntity.js');
module.exports.OrderRepository = require('./OrderRepository.js');
module.exports.OrderService = require('./OrderService.js');
module.exports.orderItems = require('./order-items');

const DB = require('@vectoricons.net/db');

const OrderEntity = require('./OrderEntity.js');
const OrderRepository = require('./OrderRepository.js');
const OrderService = require('./OrderService.js');

const initOrderService = () => {
    return new OrderService({
        repository: new OrderRepository({ DB }),
        entityClass: OrderEntity,
    });
};

module.exports.initOrderService = initOrderService;