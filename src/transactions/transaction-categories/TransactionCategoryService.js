'use strict';

const BaseService = require('../../common/BaseService');
const TransactionCategoryEntity = require('./TransactionCategoryEntity');
const TransactionCategoryRepository = require('./TransactionCategoryRepository');

/**
 * @module Transactions Domain
 * @fileoverview TransactionCategoryService - Service for managing transaction categories business logic.
 * @class TransactionCategoryService
 */
class TransactionCategoryService extends BaseService {
    constructor({ 
        repository = new TransactionCategoryRepository({ DB : require('@vectoricons.net/db') }), 
        entityClass = TransactionCategoryEntity,
    } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = TransactionCategoryService;