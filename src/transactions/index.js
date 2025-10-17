'use strict';

const TransactionItemRepository = require("./transaction-items/TransactionItemRepository.js");
const TransactionRepository = require("./TransactionRepository.js");
const TransactionService = require("./TransactionService.js");
const TransactionEntity = require("./TransactionEntity.js");
const { initCouponCodeService } = require("../coupon-codes")
const { initTransactionItemService } = require("./transaction-items");
const { initTransactionCategoryService } = require("./transaction-categories");
const DB = require('@vectoricons.net/db');

/**
 * Initialize the transaction service
 * @param {Object} params
 * @param {Object} params.DB - The database instance
 * @param {Object} params.ModelsRegistry - The models registry instance
 * @param {string} params.couponCode - The coupon code to be used
 * @returns {TransactionService} - The initialized transaction service
 * @throws {Error} - If the coupon code is invalid
 */
const initTransactionService = () => {
    return new TransactionService({
        TransactionRepository       : new TransactionRepository({ DB }),
        TransactionItemRepository   : new TransactionItemRepository({ DB }),
        entityClass                 : TransactionEntity,
        TransactionItemService      : initTransactionItemService({ DB }),
        TransactionCategoryService  : initTransactionCategoryService({ DB }),
        CouponCodeService           : initCouponCodeService({ DB }),
    });
}

module.exports = {
    initTransactionService,
    TransactionRepository,
    TransactionItemRepository,
    TransactionService,
};