'use strict';

const BaseService = require('../../common/BaseService');
const TransactionItemEntity = require('./TransactionItemEntity');
const TransactionItemRepository = require('./TransactionItemRepository');

/**
 * @module Transactions Domain
 * @fileoverview TransactionItemService - Service for managing transaction items business logic.
 * @class TransactionItemService
 */
class TransactionItemService extends BaseService {
    constructor({ 
        repository = new TransactionItemRepository({
            DB: require('@vectoricons.net/db'),
        }), 
        entityClass = TransactionItemEntity,
    } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = TransactionItemService;