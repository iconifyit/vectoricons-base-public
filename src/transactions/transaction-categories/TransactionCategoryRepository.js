'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionCategoryEntity = require('./TransactionCategoryEntity');

/**
 * TransactionCategoryRepository class
 * @class TransactionCategoryRepository
 * @description This class is responsible for managing transaction categories data.
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
