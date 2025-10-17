'use strict';

const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Transactions Domain
 * @fileoverview TransactionsViewEntity - Immutable transactions-view representation.
 */
class TransactionsViewEntity extends createEntityFromModel(DB.transactionsView, {}, {
    allowedColumns: [
        'user_id',
        'account_id',
        'amount',
        'entity_id',
        'entity_type',
        'transaction_type_id',
        'payment_type_id',
        'payment_type',
        'created_at',
        'transaction_type_label',
        'transaction_type_operation',
        'transaction_uuid'
    ],    
    relatedEntities: {
        user: () => require('../../users/UserEntity'),
        account: () => require('../../accounts/AccountEntity'),
        transactionType: () => require('../transaction-types/TransactionTypeEntity'),
        paymentType: () => require('../payment-types/PaymentTypeEntity'),
        transaction: () => require('../TransactionEntity'),
    },
}) {}

module.exports = TransactionsViewEntity;
