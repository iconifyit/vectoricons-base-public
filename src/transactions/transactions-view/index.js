'use strict';

const TransactionsViewService = require('./TransactionsViewService');
const TransactionsViewRepository = require('./TransactionsViewRepository');
const DB = require('@vectoricons.net/db');

/**
 * Initializes the TransactionsViewService with injected dependencies.
 * @returns {TransactionsViewService}
 */
const initTransactionsViewService = () => {
    return new TransactionsViewService({
        repository  : new TransactionsViewRepository({ DB }),
        entityClass : require('./TransactionsViewEntity'),
    });
};

module.exports = {
    TransactionsViewService,
    TransactionsViewRepository,
    initTransactionsViewService,
};