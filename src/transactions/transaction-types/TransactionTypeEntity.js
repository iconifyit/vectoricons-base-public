'use strict';

const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Transactions Domain
 * @fileoverview TransactionTypeEntity - Immutable transaction-type representation.
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