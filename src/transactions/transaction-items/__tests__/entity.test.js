/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TransactionItemEntity = require('../TransactionItemEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');
const enums = require('../../../utils/enums');

let testCounter = 0;
let actualPaymentType = null;
let actualTransactionType = null;
let actualTransactionCategory = null;

beforeAll(async () => {
    // Query for existing lookup records
    actualPaymentType = await DB.paymentTypes.query()
        .where({ type: enums.paymentType.PREPAID_CREDITS })
        .first();

    if (!actualPaymentType) {
        throw new Error('Payment type PREPAID_CREDITS not found in database. Ensure lookup tables are seeded.');
    }

    actualTransactionType = await DB.transactionTypes.query()
        .where({ label: 'credit' })
        .first();

    if (!actualTransactionType) {
        throw new Error('Transaction type "credit" not found in database. Ensure lookup tables are seeded.');
    }

    actualTransactionCategory = await DB.transactionCategories.query()
        .where({ value: 'sale' })
        .first();

    if (!actualTransactionCategory) {
        throw new Error('Transaction category "sale" not found in database. Ensure lookup tables are seeded.');
    }
});

const seedOne = () => {
    testCounter++;
    if (!actualTransactionType || !actualPaymentType) {
        throw new Error('Required lookup records not initialized for seedOne');
    }
    return {
        id: testCounter,
        amount: 50.00 + testCounter,
        transactionId: 1,
        transactionTypeId: actualTransactionType.id,
        paymentTypeId: actualPaymentType.id,
        accountId: 1,
        orderItemId: null,
        memo: `Test transaction item ${testCounter}`,
        commissionAmount: 0.10,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    if (!actualPaymentType || !actualTransactionType || !actualTransactionCategory) {
        throw new Error('Required lookup records not initialized');
    }
    return {
        transaction: {
            id: 1,
            uuid: 'test-uuid',
            amount: 100.00,
            paymentTypeId: actualPaymentType.id,
            transactionCategoryId: actualTransactionCategory.id,
            orderId: null,
        },
        orderItem: {
            id: 1,
            orderId: 1,
            entityId: 1,
            entityType: 'test_entity',
            amount: 50.00,
        },
        account: {
            id: 1,
            label: 'Test Account',
            userId: 1,
            balance: 0,
        },
        paymentType: actualPaymentType,
        transactionType: actualTransactionType,
    };
};

const updateOne = (entity) => {
    return {
        amount: entity.amount + 10.00,
    };
};

entityContract({
    name: 'TransactionItem',
    Model: DB.transactionItems,
    Entity: TransactionItemEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
