// Path: src/orders/OrderRepository.js
const BaseRepository = require('../common/BaseRepository');
const OrderEntity = require('./OrderEntity');

/**
 * Provides DB operations for orders.
 * @extends BaseRepository
 */
class OrderRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'orders',
            entityClass: OrderEntity,
        });
    }
}

module.exports = OrderRepository;
