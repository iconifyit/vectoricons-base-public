'use strict';

const TransactionItemService = require('./TransactionItemService');
const TransactionItemRepository = require('./TransactionItemRepository');
const DB = require('@vectoricons.net/db');

/**
 * Initializes the TransactionItemService with injected dependencies.
 * @returns {TransactionItemService}
 */
const initTransactionItemService = () => {
    return new TransactionItemService({
        repository  : new TransactionItemRepository({ DB }),
        entityClass : require('./TransactionItemEntity'),
    });
};

module.exports = {
    TransactionItemService,
    TransactionItemRepository,
    initTransactionItemService,
};