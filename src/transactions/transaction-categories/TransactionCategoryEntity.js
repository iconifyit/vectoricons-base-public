'use strict';

const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Transactions Domain
 * @fileoverview TransactionCategoryEntity - Immutable transaction category representation.
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