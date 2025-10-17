const enums = require('../../../utils/enums');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    return {
        type: enums.paymentType.PREPAID_CREDITS,
        description: `Test payment type ${testCounter}`,
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
