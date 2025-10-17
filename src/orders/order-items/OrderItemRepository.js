// Path: src/orders/order-items/OrderItemRepository.js
const BaseRepository = require('../../common/BaseRepository');
const OrderItemEntity = require('./OrderItemEntity');

/**
 * Provides DB operations for orders.
 * @extends BaseRepository
 */
class OrderItemRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'orderItems',
            entityClass: OrderItemEntity,
        });
    }
}

module.exports = OrderItemRepository;
