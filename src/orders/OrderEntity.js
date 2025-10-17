// Path: src/orders/OrderEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Orders Domain
 * @fileoverview OrderEntity - Immutable order representation.
 */
class OrderEntity extends createEntityFromModel(DB.orders, {}, {
    allowedColumns: [
        'id',
        'user_id',
        'cart_id',
        'total_amount',
        'discounted_total',
        'created_at',
        'updated_at',
        'status'
    ],
    relatedEntities: {
        invoices: () => require('../stripe/invoices/InvoiceEntity'),
        user: () => require('../users/UserEntity'),
        transactions: () => require('../transactions/TransactionEntity'),
        cart: () => require('../carts/CartEntity'),
        orderItems: () => require('./order-items/OrderItemEntity'),
    },
}) {}

module.exports = OrderEntity;