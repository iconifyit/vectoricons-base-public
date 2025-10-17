// Path: src/purchasedItems/PurchasedItemService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const PurchasedItemRepository = require('./PurchasedItemRepository');
const PurchasedItemEntity = require('./PurchasedItemEntity');

/**
 * Service for managing purchasedItems.
 * @extends BaseService
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
