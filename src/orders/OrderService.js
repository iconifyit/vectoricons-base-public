// Path: src/images/OrderService.js
const OrderRepository = require('./OrderRepository');
const OrderEntity = require('./OrderEntity');
const BaseService = require('../common/BaseService');
const DB = require('@vectoricons.net/db');

/**
 * Service for managing orders.
 * Provides functionality for creating, retrieving, updating, and deleting orders.
 */
class OrderService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new OrderRepository({ DB }),
            entityClass: entityClass || OrderEntity,
        });
    }
}

module.exports = OrderService;