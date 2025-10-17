// Path: src/purchasedItems/PurchasedItemRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const PurchasedItemEntity = require('./PurchasedItemEntity');

/**
 * @module Products Domain
 * @fileoverview PurchasedItemRepository - Provides DB operations for purchased items.
 */
class PurchasedItemRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'purchasedItems',
            entityClass: PurchasedItemEntity,
        });
    }
}

module.exports = PurchasedItemRepository;
