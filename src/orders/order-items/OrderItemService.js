// Path: src/images/OrderItemService.js
const OrderItemRepository = require('./OrderItemRepository');
const OrderItemEntity = require('./OrderItemEntity');
const BaseService = require('../../common/BaseService');
const DB = require('@vectoricons.net/db');

/**
 * @module Orders Domain
 * @fileoverview OrderItemService - Service for managing order items.
 */
class OrderItemService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new OrderItemRepository({ DB }),
            entityClass: entityClass || OrderItemEntity,
        });
    }
}

module.exports = OrderItemService;