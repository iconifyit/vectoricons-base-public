// Path: src/transactions/transaction-items/TransactionItemEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a transaction-item entity in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class TransactionItemEntity extends createEntityFromModel(DB.transactionItems, {}, {
    relatedEntities: {
        transaction: () => require('../TransactionEntity'),
        orderItem: () => require('../../orders/order-items/OrderItemEntity'),
        account: () => require('../../accounts/AccountEntity'),
        paymentType: () => require('../payment-types/PaymentTypeEntity'),
        transactionType: () => require('../transaction-types/TransactionTypeEntity'),
    },
    allowedColumns: [
        'id',
        'amount',
        'transaction_id',
        'transaction_type_id',
        'payment_type_id',
        'order_item_id',
        'account_id',
        'memo',
        'commission_amount',
        'created_at',
        'updated_at'
    ],
}) {}

module.exports = TransactionItemEntity;