/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TransactionEntity = require('../TransactionEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');
const enums = require('../../utils/enums');
const { v4: uuidv4 } = require('uuid');

let testCounter = 0;
let actualPaymentType = null;
let actualTransactionCategory = null;

beforeAll(async () => {
    // Query for existing payment type instead of creating new one
    actualPaymentType = await DB.paymentTypes.query()
        .where({ type: enums.paymentType.PREPAID_CREDITS })
        .first();

    if (!actualPaymentType) {
        throw new Error('Payment type PREPAID_CREDITS not found in database. Ensure lookup tables are seeded.');
    }

    // Query for existing transaction category instead of creating new one
    actualTransactionCategory = await DB.transactionCategories.query()
        .where({ value: 'sale' })
        .first();

    if (!actualTransactionCategory) {
        throw new Error('Transaction category "sale" not found in database. Ensure lookup tables are seeded.');
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        uuid: uuidv4(),
        amount: 100.00 + testCounter,
        paymentTypeId: actualPaymentType?.id || 1,
        transactionCategoryId: actualTransactionCategory?.id || 1,
        orderId: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    if (!actualPaymentType || !actualTransactionCategory) {
        throw new Error('Actual payment type or transaction category not initialized');
    }
    return {
        transactionItems: [],
        order: null,
        paymentType: actualPaymentType,
        transactionCategory: actualTransactionCategory,
    };
};

const updateOne = (entity) => {
    return {
        amount: entity.amount + 10.00,
    };
};

entityContract({
    name: 'Transaction',
    Model: DB.transactions,
    Entity: TransactionEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
