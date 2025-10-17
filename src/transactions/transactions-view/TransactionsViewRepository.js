'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionsViewEntity = require('./TransactionsViewEntity');

/**
 * @module Transactions Domain
 * @fileoverview TransactionsViewRepository - Manages transactions view data.
 * @class TransactionsViewRepository
 */
class TransactionsViewRepository extends BaseRepository {
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'transactionsView',
            entityClass: TransactionsViewEntity,
        });
    }
}

module.exports = TransactionsViewRepository;