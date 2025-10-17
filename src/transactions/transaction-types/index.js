'use strict';

const TransactionTypeService = require('./TransactionTypeService');
const TransactionTypeRepository = require('./TransactionTypeRepository');

/**
 * Initializes the TransactionTypeService with injected dependencies.
 * @returns {TransactionTypeService}
 */
const initTransactionTypeService = () => {
    return new TransactionTypeService({
        repository  : new TransactionTypeRepository({ 
            DB : require('@vectoricons.net/db'),
        }),
        entityClass : require('./TransactionTypeEntity'),
    });
};

module.exports = {
    TransactionTypeService,
    TransactionTypeRepository,
    initTransactionTypeService,
};