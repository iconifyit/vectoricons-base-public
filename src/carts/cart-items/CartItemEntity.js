// Path: src/carts/cart-items/CartItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a cart item in the system.    
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/cart-items.js} Objection.js model for cartItems
 */
class CartItemEntity extends createEntityFromModel(DB.cartItems, {}, {
    allowedColumns: [
        'id',
        'cart_id',
        'entity_id',
        'entity_type',
        'price',
        'is_active',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        cart: () => require('../CartEntity'),
    },
}) {}

module.exports = CartItemEntity;