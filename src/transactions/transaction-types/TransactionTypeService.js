'use strict';

const BaseService = require('../../common/BaseService');
const TransactionTypeEntity = require('./TransactionTypeEntity');
const TransactionTypeRepository = require('./TransactionTypeRepository');

/**
 * @module Transactions Domain
 * @fileoverview TransactionTypeService - Service for managing transaction types business logic.
 * @class TransactionTypeService
 */
class TransactionTypeService extends BaseService {
    constructor({ 
        repository = new TransactionTypeRepository({
            DB: require('@vectoricons.net/db'),
        }), 
        entityClass = TransactionTypeEntity,
    } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = TransactionTypeService;