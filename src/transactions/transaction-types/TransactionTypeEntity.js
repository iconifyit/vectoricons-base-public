'use strict';

const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a transaction-type item in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class TransactionTypeEntity extends createEntityFromModel(DB.transactionTypes, {}, {
    allowedColumns: [
        'id',
        'label',
        'operation'
    ],
    relatedEntities: {},
}) {}

module.exports = TransactionTypeEntity;