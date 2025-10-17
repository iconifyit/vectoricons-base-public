// Path: src/orders/order-items/OrderItemRepository.js
const BaseRepository = require('../../common/BaseRepository');
const OrderItemEntity = require('./OrderItemEntity');

/**
 * @module Orders Domain
 * @fileoverview OrderItemRepository - Provides DB operations for order items.
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
