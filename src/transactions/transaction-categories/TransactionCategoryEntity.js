'use strict';

const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a transaction category item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/transaction-categories.js} Objection.js model for transaction-categories
 */
class TransactionCategoryEntity extends createEntityFromModel(DB.transactionCategories, {}, {
    allowedColumns: [
        'id',
        'value',
        'label',
        'created_at',
        'updated_at'
    ],
    relatedEntities: {},
}) {}

module.exports = TransactionCategoryEntity;