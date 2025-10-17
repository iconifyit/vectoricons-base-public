// Path: src/purchasedItems/PurchasedItemService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const PurchasedItemRepository = require('./PurchasedItemRepository');
const PurchasedItemEntity = require('./PurchasedItemEntity');

/**
 * @module Products Domain
 * @fileoverview PurchasedItemService - Service for managing purchased items.
 */
class PurchasedItemService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new PurchasedItemRepository({ DB }),
            entityClass: entityClass || PurchasedItemEntity,
        });
    }
}

module.exports = PurchasedItemService;
