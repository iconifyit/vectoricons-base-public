// Path: src/transactions/payment-types/PaymentTypeEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a payment-type item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/payment-types.js} Objection.js model for payment-types
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