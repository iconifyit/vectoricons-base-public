/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const FamilyEntity = require('../FamilyEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualUser = null;

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
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        name: `Family ${testCounter}`,
        price: 29.99,
        description: null,
        licenseId: 21,
        teamId: null,
        uniqueId: `fam${testCounter}`,
        userId: 1,
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
        sets: [],  // Empty array for sets
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
    };
};

entityContract({
    name: 'Family',
    Model: DB.families,
    Entity: FamilyEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
