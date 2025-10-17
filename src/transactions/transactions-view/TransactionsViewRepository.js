'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionsViewEntity = require('./TransactionsViewEntity');

/**
 * TransactionsViewRepository class
 * @class TransactionsViewRepository
 * @description This class is responsible for managing transaction items data.
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