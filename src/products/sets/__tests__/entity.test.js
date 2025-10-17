/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SetEntity = require('../SetEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualUser = null;
let actualFamily = null;

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

    // Fetch first available family for relation tests
    const family = await DB.families.query().where({ is_deleted: false, is_active: true }).first();
    if (family) {
        actualFamily = {
            id: family.id,
            name: family.name,
            price: family.price,
            description: family.description,
            licenseId: family.license_id,
            teamId: family.team_id,
            uniqueId: family.unique_id,
            userId: family.user_id,
            sort: family.sort,
            isActive: family.is_active,
            createdAt: family.created_at,
            updatedAt: family.updated_at,
            isDeleted: family.is_deleted,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        name: `Set ${testCounter}`,
        price: 19.99,
        familyId: actualFamily?.id || 1,
        licenseId: 21,
        typeId: null,
        styleId: null,
        teamId: null,
        uniqueId: `set${testCounter}`,
        userId: 1,
        description: null,
        sort: 0,
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
        family: actualFamily || {
            id: 1,
            name: 'Test Family',
            price: '29.99',
            description: null,
            licenseId: 21,
            teamId: null,
            uniqueId: 'fam1',
            userId: 1,
            sort: 0,
            isActive: true,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
            isDeleted: false,
        },
        icons: [],  // Empty array for icons
        illustrations: [],  // Empty array for illustrations
        owner: actualUser || {
            id: 1,
            email: 'test@test.com',
            username: 'testuser',
            displayName: 'Test User',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        teamType: null,  // Nullable relation
        images: [],  // Empty array for images
        license: {
            id: 21,
            name: 'Test License',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        productsType: null,  // Nullable relation
        style: null,  // Nullable relation
        team: null,  // Nullable relation
        user: actualUser || {
            id: 1,
            email: 'test@test.com',
            username: 'testuser',
            displayName: 'Test User',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        tags: [],  // Empty array for tags
    };
};

entityContract({
    name: 'Set',
    Model: DB.sets,
    Entity: SetEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
