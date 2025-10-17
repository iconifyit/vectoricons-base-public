let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    return {
        entity_id: testCounter,
        entity_type: 'icon',
        user_id: 1,
        is_active: true,
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

const seedEntity = async (opts = {}) => {
    const dbData = await seedOne(opts);
    return {
        id         : dbData.id || 1,
        entityId   : dbData.entity_id,
        entityType : dbData.entity_type,
        userId     : dbData.user_id,
        isActive   : dbData.is_active,
        createdAt  : new Date(dbData.created_at),
        updatedAt  : new Date(dbData.updated_at),
    };
};

module.exports = {
    seedOne,
    seedMany,
    seedEntity,
};
