let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Alternate between credit and debit
    const isCredit = testCounter % 2 === 1;

    return {
        label: isCredit ? 'credit' : 'debit',
        operation: isCredit ? 1 : -1,
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
