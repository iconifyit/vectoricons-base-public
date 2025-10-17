// Path: src/orders/order-items/OrderItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Orders Domain
 * @fileoverview OrderItemEntity - Immutable order item representation.
 */
class OrderItemEntity extends createEntityFromModel(DB.orderItems, {}, {
    allowedColumns: [
        'id',
        'order_id',
        'entity_id',
        'entity_type',
        'cart_item_id',
        'amount',
        'discounted_amount',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        order: () => require('../OrderEntity'),
        cartItems: () => require('../../carts/cart-items/CartItemEntity'),
    },
}) {}

module.exports = OrderItemEntity;