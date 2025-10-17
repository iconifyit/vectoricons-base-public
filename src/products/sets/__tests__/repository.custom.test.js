/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SetRepository = require('../SetRepository');
const SetEntity = require('../SetEntity');

let testCounter = 0;
let testFamilyId = null;

beforeAll(async () => {
    // Get an existing family_id for test data
    const family = await DB.families.query().where({ is_deleted: false, is_active: true }).first();
    if (family) {
        testFamilyId = family.id;
    }
});

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Set ${testCounter}`,
        price: 19.99,
        family_id: testFamilyId || 1,
        license_id: 21,
        user_id: 1,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new SetRepository({ DB });
};

// Custom repository method tests
describe('SetRepository - Custom Methods', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        repository = new SetRepository({ DB: require('@vectoricons.net/db') });
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
        }
    });

    describe('findByUniqueId', () => {
        test('finds set by unique_id', async () => {
            const setData = await seedOne();
            const created = await repository.create(setData, { trx });

            const found = await repository.findByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(SetEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('returns undefined for non-existent unique_id', async () => {
            const found = await repository.findByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('findAllActive', () => {
        test('returns only active and non-deleted sets', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(active1, { trx });
            await repository.create(active2, { trx });
            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeSets = await repository.findAllActive({ trx });

            // Should only include the two active, non-deleted sets
            const ourActiveSets = activeSets.filter(s =>
                s.name === active1.name || s.name === active2.name
            );

            expect(ourActiveSets.length).toBe(2);
            expect(ourActiveSets.every(s => s.isActive && !s.isDeleted)).toBe(true);
        });

        test('returns empty array when no active sets exist', async () => {
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeSets = await repository.findAllActive({ trx });

            // Filter to only our test sets
            const ourSets = activeSets.filter(s =>
                s.name === inactive.name || s.name === deleted.name
            );

            expect(ourSets.length).toBe(0);
        });
    });

    describe('findByFamilyId', () => {
        test('finds sets by family_id', async () => {
            const set1 = await seedOne();
            const set2 = await seedOne();

            const created1 = await repository.create(set1, { trx });
            const created2 = await repository.create(set2, { trx });

            const familySets = await repository.findByFamilyId(testFamilyId, { trx });
            const ourSets = familySets.filter(s =>
                s.id === created1.id || s.id === created2.id
            );

            expect(ourSets.length).toBe(2);
            expect(ourSets.every(s => s.familyId === testFamilyId)).toBe(true);
        });

        test('returns empty array for family with no sets', async () => {
            const nonExistentFamilyId = 999999;
            const familySets = await repository.findByFamilyId(nonExistentFamilyId, { trx });

            expect(Array.isArray(familySets)).toBe(true);
            expect(familySets.length).toBe(0);
        });
    });
});
