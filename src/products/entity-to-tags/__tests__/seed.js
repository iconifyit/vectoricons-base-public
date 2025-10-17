const DB = require('@vectoricons.net/db');
const uuid = require('uuid').v4;

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    const icons = await DB.icons.query(trx).where({ is_active: true }).limit(10);
    const tag = await DB.tags.query(trx).insert({
        name: uuid().split('-').pop(),
    }).returning('*').first();

    console.log('seedOne tag:', tag);
    
    if (icons.length === 0 || !tag) {
        throw new Error('No icons or tags found in the database for seeding test data');
    }
    return {
        entity_id: icons[Math.floor(Math.random() * icons.length)].id,
        entity_type: 'icon',
        tag_id: tag.id,
    };
};

const seedMany = async (opts = {}) => {
    const { n = 5, trx } = opts;
    const items = [];
    for (let i = 0; i < n; i++) {
        testCounter++;
        items.push(await seedOne({ trx }));
    }

    console.log(`seedMany tags`, items);
    return items;
};

module.exports = {
    seedOne,
    seedMany,
};