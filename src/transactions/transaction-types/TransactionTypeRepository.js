'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionTypeEntity = require('./TransactionTypeEntity');

/**
 * TransactionTypeRepository class
 * @class TransactionTypeRepository
 * @description This class is responsible for managing transaction items data.
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