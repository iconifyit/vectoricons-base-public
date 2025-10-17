const DB = require('@vectoricons.net/db');
const enums = require('../../../utils/enums');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Get or create a cart for testing
    const cart = await DB.carts.query(trx).insert({
        user_id: 1,
        status: enums.cartStatus.NotProcessed,
    }).returning('*');

    return {
        cart_id: cart.id,
        entity_id: 100 + testCounter,
        entity_type: 'icon',
        price: 10.00 + testCounter,
        is_active: true,
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
