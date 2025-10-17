// Path: src/carts/CartEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Carts Domain
 * @fileoverview CartEntity - Immutable cart representation.
 */
class CartEntity extends createEntityFromModel(DB.carts, {}, {
    allowedColumns: [
        'id',
        'user_id',
        'cart_items',
        'subtotal',
        'tax',
        'discount',
        'total',
        'status',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        user      : () => require('../users/UserEntity'),
        cartItems : () => require('./cart-items/CartItemEntity'),
        orders    : () => require('../orders/OrderEntity'),
    },
}) {}

module.exports = CartEntity;