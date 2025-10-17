'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionTypeEntity = require('./TransactionTypeEntity');

/**
 * @module Transactions Domain
 * @fileoverview TransactionTypeRepository - Manages transaction types data.
 * @class TransactionTypeRepository
 */
class TransactionTypeRepository extends BaseRepository {
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'transactionTypes',
            entityClass: TransactionTypeEntity,
        });
    }
}

module.exports = TransactionTypeRepository;