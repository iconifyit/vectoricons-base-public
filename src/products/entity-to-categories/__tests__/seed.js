const DB = require('@vectoricons.net/db');
const uuid = require('uuid').v4;

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    const icons = await DB.icons.query(trx).where({ is_active: true }).limit(10);
    const category = await DB.categories.query(trx).insert({
        name: uuid().split('-').pop(),
    }).returning('*').first();

    console.log('seedOne category:', category);

    if (icons.length === 0 || !category) {
        throw new Error('No icons or categories found in the database for seeding test data');
    }
    return {
        entity_id: icons[Math.floor(Math.random() * icons.length)].id,
        entity_type: 'icon',
        category_id: category.id,
    };
};

const seedMany = async (opts = {}) => {
    const { n = 5, trx } = opts;
    const items = [];
    for (let i = 0; i < n; i++) {
        testCounter++;
        items.push(await seedOne({ trx }));
    }

    console.log(`seedMany categories`, items);
    return items;
};

module.exports = {
    seedOne,
    seedMany,
};
