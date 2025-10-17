/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IllustrationRepository = require('../IllustrationRepository');
const IllustrationEntity = require('../IllustrationEntity');

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
        name: `Illustration ${testCounter}`,
        width: 512,
        height: 512,
        set_id: testSetId || 1,
        license_id: 21,
        user_id: 1,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new IllustrationRepository({ DB });
};

// Custom repository method tests
describe('IllustrationRepository - Custom Methods', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        repository = new IllustrationRepository({ DB: require('@vectoricons.net/db') });
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
        test('finds illustration by unique_id', async () => {
            const illustrationData = await seedOne();
            const created = await repository.create(illustrationData, { trx });

            const found = await repository.findByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(IllustrationEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('returns undefined for non-existent unique_id', async () => {
            const found = await repository.findByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('findAllActive', () => {
        test('returns only active and non-deleted illustrations', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            const created1 = await repository.create(active1, { trx });
            const created2 = await repository.create(active2, { trx });
            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeIllustrations = await repository.findAllActive({ trx });

            // Should only include the two active, non-deleted illustrations
            const ourActiveIllustrations = activeIllustrations.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourActiveIllustrations.length).toBe(2);
            expect(ourActiveIllustrations.every(i => i.isActive && !i.isDeleted)).toBe(true);
        });

        test('returns empty array when no active illustrations exist', async () => {
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            const createdInactive = await repository.create(inactive, { trx });
            const createdDeleted = await repository.create(deleted, { trx });

            const activeIllustrations = await repository.findAllActive({ trx });

            // Filter to only our test illustrations
            const ourIllustrations = activeIllustrations.filter(i =>
                i.id === createdInactive.id || i.id === createdDeleted.id
            );

            expect(ourIllustrations.length).toBe(0);
        });
    });

    describe('findBySetId', () => {
        test('finds illustrations by set_id', async () => {
            const illustration1 = await seedOne();
            const illustration2 = await seedOne();

            const created1 = await repository.create(illustration1, { trx });
            const created2 = await repository.create(illustration2, { trx });

            const setIllustrations = await repository.findBySetId(testSetId, { trx });
            const ourIllustrations = setIllustrations.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIllustrations.length).toBe(2);
            expect(ourIllustrations.every(i => i.setId === testSetId)).toBe(true);
        });

        test('excludes deleted illustrations from findBySetId', async () => {
            const illustration = { ...await seedOne(), is_deleted: true };
            const created = await repository.create(illustration, { trx });

            const setIllustrations = await repository.findBySetId(testSetId, { trx });
            const found = setIllustrations.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });

        test('returns empty array for set with no illustrations', async () => {
            const nonExistentSetId = 999999;
            const setIllustrations = await repository.findBySetId(nonExistentSetId, { trx });

            expect(Array.isArray(setIllustrations)).toBe(true);
            expect(setIllustrations.length).toBe(0);
        });
    });
});
