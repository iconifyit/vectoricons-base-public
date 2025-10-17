'use strict';

const BaseService = require('../../common/BaseService');
const TransactionsViewEntity = require('./TransactionsViewEntity');
const TransactionsViewRepository = require('./TransactionsViewRepository');

/**
 * @module Transactions Domain
 * @fileoverview TransactionsViewService - Service for managing transactions view business logic.
 * @class TransactionsViewService
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