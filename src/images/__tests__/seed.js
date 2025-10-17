const DB = require('@vectoricons.net/db');
const enums = require('../../../refs/enums');

let testCounter = 0;
let cachedImageTypeId = null;
let cachedIconId = null;

// Cache lookup data once at module load
const initCache = async () => {
    if (!cachedImageTypeId) {
        const imageType = await DB.imageTypes.query().where({ id: 1 }).first();
        if (imageType) {
            cachedImageTypeId = imageType.id;
        }
    }
    if (!cachedIconId) {
        const icon = await DB.icons.query().where({ user_id: 1 }).first();
        if (icon) {
            cachedIconId = icon.id;
        }
    }
};

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    // Initialize cache on first call
    await initCache();

    return {
        entity_type: enums.ImageEntityTypes.Icon,
        entity_id: cachedIconId,
        image_type_id: cachedImageTypeId,
        image_hash: `hash_${testCounter}`,
        visibility: enums.ImageVisibilities.Public,
        access: enums.ImageAccessLevels.All,
        name: `test_image_${testCounter}.png`,
        file_type: enums.AllowedImageFileTypes.PNG,
        url: `https://example.com/images/test_${testCounter}.png`,
        unique_id: `img_${String(testCounter).padStart(8, '0')}`,
        color_data: '',
        object_key: '',
        is_active: true,
        is_deleted: false,
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
        id           : dbData.id || 1,
        entityType   : dbData.entity_type,
        entityId     : dbData.entity_id,
        imageTypeId  : dbData.image_type_id,
        imageHash    : dbData.image_hash,
        visibility   : dbData.visibility,
        access       : dbData.access,
        name         : dbData.name,
        fileType     : dbData.file_type,
        url          : dbData.url,
        uniqueId     : dbData.unique_id,
        colorData    : dbData.color_data || '',
        objectKey    : dbData.object_key || '',
        isActive     : dbData.is_active,
        isDeleted    : dbData.is_deleted,
        createdAt    : new Date(dbData.created_at),
        updatedAt    : new Date(dbData.updated_at),
    };
};

module.exports = {
    seedOne,
    seedMany,
    seedEntity,
};
