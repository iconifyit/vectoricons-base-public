// Path: src/products/purchased-items/PurchasedItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview PurchasedItemEntity - Immutable purchased item representation.
 */
class PurchasedItemEntity extends createEntityFromModel(DB.purchasedItems) {}

module.exports = PurchasedItemEntity;