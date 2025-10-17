'use strict';

const BaseService = require('../../common/BaseService');
const TransactionsViewEntity = require('./TransactionsViewEntity');
const TransactionsViewRepository = require('./TransactionsViewRepository');

/**
 * TransactionsViewService class
 * @class TransactionsViewService
 * @description This class is responsible for managing transaction items business logic.
 */
class TransactionsViewService extends BaseService {
    constructor({ 
        repository = new TransactionsViewRepository({
            DB: require('@vectoricons.net/db'),
        }), 
        entityClass = TransactionsViewEntity,
    } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = TransactionsViewService;