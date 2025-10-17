// Path: src/transactions/payment-types/PaymentTypeEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Transactions Domain
 * @fileoverview PaymentTypeEntity - Immutable payment-type representation.
 */
class PaymentTypeEntity extends createEntityFromModel(DB.paymentTypes, {}, {
    allowedColumns: [
        'id',
        'type',
        'description'
    ],
    relatedEntities: {
        transaction: () => require('../TransactionEntity'),
    },
}) {}

module.exports = PaymentTypeEntity;