// Path: src/images/OrderService.js
const OrderRepository = require('./OrderRepository');
const OrderEntity = require('./OrderEntity');
const BaseService = require('../common/BaseService');
const DB = require('@vectoricons.net/db');

/**
 * @module Orders Domain
 * @fileoverview OrderService - Service for managing orders.
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