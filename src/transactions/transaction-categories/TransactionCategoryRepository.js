'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionCategoryEntity = require('./TransactionCategoryEntity');

/**
 * @module Transactions Domain
 * @fileoverview TransactionCategoryRepository - Manages transaction categories data.
 * @class TransactionCategoryRepository
 */
class TransactionCategoryRepository extends BaseRepository {
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'transactionCategories',
            entityClass: TransactionCategoryEntity,
        });
    }
}

module.exports = TransactionCategoryRepository;
