// Path: src/carts/cart-items/CartItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a cart item in the system.    
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/cart-items.js} Objection.js model for cartItems
 */
class CartItemEntity extends createEntityFromModel(DB.cartItems) {}

module.exports = CartItemEntity;