// Path: src/products/purchased-items/PurchasedItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a purchased item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/purchased-items.js} Objection.js model for licenses
 */
class PurchasedItemEntity extends createEntityFromModel(DB.purchasedItems) {}

module.exports = PurchasedItemEntity;