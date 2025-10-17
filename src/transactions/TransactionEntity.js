// Path: src/transactions/TransactionEntity.js
const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Transactions Domain
 * @fileoverview TransactionEntity - Immutable transaction representation.
 */
class TransactionEntity extends createEntityFromModel(DB.transactions, {}, {
    allowedColumns: [
        'id',
        'uuid',
        'amount',
        'order_id',
        'payment_type_id',
        'transaction_category_id',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {
        transactionItems: () => require('./transaction-items/TransactionItemEntity'),
        order: () => require('../orders/OrderEntity'),
        paymentType: () => require('./payment-types/PaymentTypeEntity'),
        transactionCategory: () => require('./transaction-categories/TransactionCategoryEntity'),
    },
}) {}

module.exports = TransactionEntity;