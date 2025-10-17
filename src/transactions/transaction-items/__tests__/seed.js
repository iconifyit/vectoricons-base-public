const DB = require('@vectoricons.net/db');
const enums = require('../../../utils/enums');
const { v4: uuidv4 } = require('uuid');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Query for existing payment type
    const paymentType = await DB.paymentTypes.query(trx)
        .where({ type: enums.paymentType.PREPAID_CREDITS })
        .first();

    if (!paymentType) {
        throw new Error('Payment type PREPAID_CREDITS not found in database. Ensure lookup tables are seeded.');
    }

    // Query for existing transaction type
    const transactionType = await DB.transactionTypes.query(trx)
        .where({ label: 'credit' })
        .first();

    if (!transactionType) {
        throw new Error('Transaction type "credit" not found in database. Ensure lookup tables are seeded.');
    }

    // Query for existing transaction category
    const transactionCategory = await DB.transactionCategories.query(trx)
        .where({ value: 'sale' })
        .first();

    if (!transactionCategory) {
        throw new Error('Transaction category "sale" not found in database. Ensure lookup tables are seeded.');
    }

    // Create an order for the FK
    const order = await DB.orders.query(trx).insert({
        user_id: 1,
        total_amount: 100.00 + testCounter,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
    }).returning('*');

    // Create an order_item for the FK
    const orderItem = await DB.orderItems.query(trx).insert({
        order_id: order.id,
        entity_id: 1,
        entity_type: 'test_entity',
        amount: 50.00 + testCounter,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
    }).returning('*');

    // Create a transaction for the FK
    const transaction = await DB.transactions.query(trx).insert({
        amount: 100.00 + testCounter,
        payment_type_id: paymentType.id,
        transaction_category_id: transactionCategory.id,
        order_id: order.id,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
        uuid: uuidv4(),
    }).returning('*');

    // Query for user 1's Revenue account (account_type_id = 2)
    const account = await DB.accounts.query(trx)
        .where({ user_id: 1, account_type_id: 2 })
        .first();

    if (!account) {
        throw new Error('No Revenue account found for user_id = 1 with account_type_id = 2. Ensure test data exists.');
    }

    return {
        amount: 50.00 + testCounter,
        transaction_id: transaction.id,
        transaction_type_id: transactionType.id,
        payment_type_id: paymentType.id,
        order_item_id: orderItem.id,
        account_id: account.id,
        memo: `Test transaction item ${testCounter}`,
        commission_amount: 0.10,
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
    };
};

const seedMany = async (opts = {}) => {
    const { n = 5, trx } = opts;
    const items = [];
    for (let i = 0; i < n; i++) {
        items.push(await seedOne({ trx }));
    }

    return items;
};

module.exports = {
    seedOne,
    seedMany,
};
