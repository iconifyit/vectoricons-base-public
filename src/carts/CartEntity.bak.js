// Path: src/carts/CartEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a cart item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/carts.js} Objection.js model for carts
 */
class CartEntity extends createEntityFromModel(DB.carts, {}, {
    relatedEntities: {
        user      : () => require('../users/UserEntity'),
        cartItems : () => require('./cart-items/CartItemEntity'),
        orders    : () => require('../orders/OrderEntity'),
    },
}) {}

module.exports = CartEntity;