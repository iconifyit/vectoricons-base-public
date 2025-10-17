const DB = require('@vectoricons.net/db');
const enums = require('../../utils/enums');
const { v4: uuidv4 } = require('uuid');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Query for existing payment type instead of creating new one
    const paymentType = await DB.paymentTypes.query(trx)
        .where({ type: enums.paymentType.PREPAID_CREDITS })
        .first();

    if (!paymentType) {
        throw new Error('Payment type PREPAID_CREDITS not found in database. Ensure lookup tables are seeded.');
    }

    // Query for existing transaction category instead of creating new one
    // Use a generic category that should exist in the system
    const transactionCategory = await DB.transactionCategories.query(trx)
        .where({ value: 'sale' })
        .first();

    if (!transactionCategory) {
        throw new Error('Transaction category "sale" not found in database. Ensure lookup tables are seeded.');
    }

    return {
        amount: 100.00 + testCounter,
        payment_type_id: paymentType.id,
        transaction_category_id: transactionCategory.id,
        // Omit order_id entirely if null
        created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T00:00:00Z').toISOString(),
        uuid: uuidv4(), // Generate valid UUID for upsert uniqueness
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
