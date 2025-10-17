const DB = require('@vectoricons.net/db');
const enums = require('../../utils/enums');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Create a cart for the order
    const cart = await DB.carts.query(trx).insert({
        user_id: 1,
        status: enums.cartStatus.NotProcessed,
    }).returning('*');

    return {
        user_id: 1,
        cart_id: cart.id,
        total_amount: 100.00 + testCounter,
        discounted_total: 95.00 + testCounter,
        status: enums.OrderStatus.PENDING,
    };
};

const seedMany = async (opts = {}) => {
    const { n = 5, trx } = opts;
    const items = [];
    for (let i = 0; i < n; i++) {
        testCounter++;
        items.push(await seedOne({ trx }));
    }

    return items;
};

module.exports = {
    seedOne,
    seedMany,
};
