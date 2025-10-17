'use strict';

const BaseService = require('../common/BaseService');
const TransactionEntity = require('./TransactionEntity');
const TransactionRepository = require('./TransactionRepository');

/**
 * TransactionService class
 * @class TransactionService
 * @description This class is responsible for managing transaction items business logic.
 */
class TransactionService extends BaseService {
    constructor({ 
        repository = new TransactionRepository({
            DB: require('@vectoricons.net/db'),
        }), 
        entityClass = TransactionEntity,
        transactionItemService,
        transactionCategoryService,
        couponCodeService,
    } = {}) {
        super({ repository, entityClass });
        this.transactionItemService     = transactionItemService;
        this.transactionCategoryService = transactionCategoryService;
        this.couponCodeService          = couponCodeService;
    }

    getPaymentTypes() {
        return this.repository.getPaymentTypes();
    }

    getTransactionTypes() {
        return this.repository.getTransactionTypes();
    }

    getTransactionCategories() {
        return this.repository.getTransactionCategories();
    }

    getTransactionHistoryByTransactionId(transactionId) {
        return this.repository.getTransactionDataByTransactionId(transactionId);
    }

    getTransactionHistoryByOrderId(orderId) {
        return this.repository.getTransactionHistoryByOrderId(orderId);
    }

    getTransactionHistoryByCartId(cartId) {
        return this.repository.getTransactionHistoryByCartId(cartId);
    }
}

module.exports = TransactionService;