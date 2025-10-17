'use strict';

const BaseService = require('../../common/BaseService');
const TransactionTypeEntity = require('./TransactionTypeEntity');
const TransactionTypeRepository = require('./TransactionTypeRepository');

/**
 * TransactionTypeService class
 * @class TransactionTypeService
 * @description This class is responsible for managing transaction items business logic.
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