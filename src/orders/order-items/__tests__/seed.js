const DB = require('@vectoricons.net/db');
const enums = require('../../../utils/enums');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Create a cart for the order
    const cart = await DB.carts.query(trx).insert({
        user_id: 1,
        status: enums.cartStatus.NotProcessed,
    }).returning('*');

    // Create an order
    const order = await DB.orders.query(trx).insert({
        user_id: 1,
        cart_id: cart.id,
        total_amount: 100.00,
        discounted_total: 95.00,
        status: enums.OrderStatus.PENDING,
    }).returning('*');

    return {
        order_id: order.id,
        entity_id: 100 + testCounter,
        entity_type: 'icon',
        amount: 10.00 + testCounter,
        discounted_amount: 9.00 + testCounter,
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
