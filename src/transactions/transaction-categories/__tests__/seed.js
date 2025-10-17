let testCounter = 0;

const categories = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'refund', label: 'Refund' },
    { value: 'credit', label: 'Credit' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'transfer', label: 'Transfer' },
];

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    const category = categories[testCounter % categories.length];

    return {
        value: `${category.value}_${testCounter}`,
        label: `${category.label} ${testCounter}`,
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
