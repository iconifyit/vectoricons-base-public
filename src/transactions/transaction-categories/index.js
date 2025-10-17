'use strict';

const TransactionCategoryService = require('./TransactionCategoryService');
const TransactionCategoryRepository = require('./TransactionCategoryRepository');
const DB = require('@vectoricons.net/db');

/**
 * Initializes the TransactionCategoryService with injected dependencies.
 * @returns {TransactionCategoryService}
 */
const initTransactionCategoryService = () => {
    return new TransactionCategoryService({
        repository  : new TransactionCategoryRepository({ DB }),
        entityClass : require('./TransactionCategoryEntity'),
    });
};

module.exports = {
    TransactionCategoryService,
    TransactionCategoryRepository,
    initTransactionCategoryService,
};