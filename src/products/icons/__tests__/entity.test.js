/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IconEntity = require('../IconEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualUser = null;
let actualSet = null;

beforeAll(async () => {
    // Fetch actual user_id=1 for relation tests
    const user = await DB.users.query().findById(1);
    if (user) {
        actualUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }

    // Fetch first available set for relation tests
    const set = await DB.sets.query().where({ is_deleted: false, is_active: true }).first();
    if (set) {
        actualSet = {
            id: set.id,
            name: set.name,
            price: set.price,
            familyId: set.family_id,
            licenseId: set.license_id,
            typeId: set.type_id,
            styleId: set.style_id,
            teamId: set.team_id,
            uniqueId: set.unique_id,
            userId: set.user_id,
            description: set.description,
            sort: set.sort,
            isActive: set.is_active,
            createdAt: set.created_at,
            updatedAt: set.updated_at,
            isDeleted: set.is_deleted,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        name: `Icon ${testCounter}`,
        price: null,
        width: 24,
        height: 24,
        setId: actualSet?.id || 1,
        styleId: null,
        teamId: null,
        userId: 1,
        uniqueId: `icon${testCounter}`,
        licenseId: 21,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        isDeleted: false,
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        popularity: [],  // Empty array for purchased items
        set: actualSet || {
            id: 1,
            name: 'Test Set',
            price: '19.99',
            familyId: 1,
            licenseId: 21,
            typeId: null,
            styleId: null,
            teamId: null,
            uniqueId: 'set1',
            userId: 1,
            description: null,
            sort: 0,
            isActive: true,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
            isDeleted: false,
        },
        style: null,  // Nullable relation
        images: [],  // Empty array for images
        tags: [],  // Empty array for tags
        team: null,  // Nullable relation
        license: {
            id: 21,
            name: 'Test License',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        user: actualUser || {
            id: 1,
            email: 'test@test.com',
            username: 'testuser',
            displayName: 'Test User',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
    };
};

entityContract({
    name: 'Icon',
    Model: DB.icons,
    Entity: IconEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
