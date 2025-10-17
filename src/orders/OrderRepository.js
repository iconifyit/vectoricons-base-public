// Path: src/orders/OrderRepository.js
const BaseRepository = require('../common/BaseRepository');
const OrderEntity = require('./OrderEntity');

/**
 * @module Orders Domain
 * @fileoverview OrderRepository - Provides DB operations for orders.
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
