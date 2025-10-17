/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IconRepository = require('../IconRepository');
const IconEntity = require('../IconEntity');

let testCounter = 0;
let testSetId = null;

beforeAll(async () => {
    // Get an existing set_id for test data
    const set = await DB.sets.query().where({ is_deleted: false, is_active: true }).first();
    if (set) {
        testSetId = set.id;
    }
});

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Icon ${testCounter}`,
        width: 24,
        height: 24,
        set_id: testSetId || 1,
        license_id: 21,
        user_id: 1,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new IconRepository({ DB });
};

// Custom repository method tests
describe('IconRepository - Custom Methods', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        repository = new IconRepository({ DB: require('@vectoricons.net/db') });
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
        test('finds icon by unique_id', async () => {
            const iconData = await seedOne();
            const created = await repository.create(iconData, { trx });

            const found = await repository.findByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(IconEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('returns undefined for non-existent unique_id', async () => {
            const found = await repository.findByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('findAllActive', () => {
        test('returns only active and non-deleted icons', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(active1, { trx });
            await repository.create(active2, { trx });
            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeIcons = await repository.findAllActive({ trx });

            // Should only include the two active, non-deleted icons
            const ourActiveIcons = activeIcons.filter(i =>
                i.name === active1.name || i.name === active2.name
            );

            expect(ourActiveIcons.length).toBe(2);
            expect(ourActiveIcons.every(i => i.isActive && !i.isDeleted)).toBe(true);
        });

        test('returns empty array when no active icons exist', async () => {
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeIcons = await repository.findAllActive({ trx });

            // Filter to only our test icons
            const ourIcons = activeIcons.filter(i =>
                i.name === inactive.name || i.name === deleted.name
            );

            expect(ourIcons.length).toBe(0);
        });
    });

    describe('findBySetId', () => {
        test('finds icons by set_id', async () => {
            const icon1 = await seedOne();
            const icon2 = await seedOne();

            const created1 = await repository.create(icon1, { trx });
            const created2 = await repository.create(icon2, { trx });

            const setIcons = await repository.findBySetId(testSetId, { trx });
            const ourIcons = setIcons.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIcons.length).toBe(2);
            expect(ourIcons.every(i => i.setId === testSetId)).toBe(true);
        });

        test('excludes deleted icons from findBySetId', async () => {
            const icon = { ...await seedOne(), is_deleted: true };
            const created = await repository.create(icon, { trx });

            const setIcons = await repository.findBySetId(testSetId, { trx });
            const found = setIcons.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });

        test('returns empty array for set with no icons', async () => {
            const nonExistentSetId = 999999;
            const setIcons = await repository.findBySetId(nonExistentSetId, { trx });

            expect(Array.isArray(setIcons)).toBe(true);
            expect(setIcons.length).toBe(0);
        });
    });
});
