// Path: src/licenses/index.js
const DB = require('@vectoricons.net/db');
const PurchasedItemEntity = require('./PurchasedItemEntity');
const PurchasedItemRepository = require('./PurchasedItemRepository');
const PurchasedItemService = require('./PurchasedItemService');

/**
 * Initializes the PurchasedItemService with injected dependencies.
 * @returns {PurchasedItemService}
 */
const initPurchasedItemService = () => {
    return new PurchasedItemService({
        repository: new PurchasedItemRepository({ DB }),
        entityClass: PurchasedItemEntity,
    });
};

module.exports = {
    PurchasedItemEntity,
    PurchasedItemRepository,
    PurchasedItemService,
    initPurchasedItemService,
};
