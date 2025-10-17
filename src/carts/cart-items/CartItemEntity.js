// Path: src/carts/cart-items/CartItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Carts Domain
 * @fileoverview CartItemEntity - Immutable cart item representation.
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