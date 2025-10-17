/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const FamilyRepository = require('../FamilyRepository');
const FamilyEntity = require('../FamilyEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Family ${testCounter}`,
        price: 29.99,
        description: `Test family ${testCounter}`,
        license_id: 21,
        user_id: 1,
        sort: 0,
        is_active: true,
        is_deleted: false,
    };
};

const initRepository = () => {
    return new FamilyRepository({ DB });
};

// Custom repository method tests
describe('FamilyRepository - Custom Methods', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        repository = new FamilyRepository({ DB: require('@vectoricons.net/db') });
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
        test('finds family by unique_id', async () => {
            const familyData = await seedOne();
            const created = await repository.create(familyData, { trx });

            const found = await repository.findByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(FamilyEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('returns undefined for non-existent unique_id', async () => {
            const found = await repository.findByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('findAllActive', () => {
        test('returns only active and non-deleted families', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(active1, { trx });
            await repository.create(active2, { trx });
            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeFamilies = await repository.findAllActive({ trx });

            // Should only include the two active, non-deleted families
            const ourActiveFamilies = activeFamilies.filter(f =>
                f.name === active1.name || f.name === active2.name
            );

            expect(ourActiveFamilies.length).toBe(2);
            expect(ourActiveFamilies.every(f => f.isActive && !f.isDeleted)).toBe(true);
        });

        test('returns empty array when no active families exist', async () => {
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await repository.create(inactive, { trx });
            await repository.create(deleted, { trx });

            const activeFamilies = await repository.findAllActive({ trx });

            // Filter to only our test families
            const ourFamilies = activeFamilies.filter(f =>
                f.name === inactive.name || f.name === deleted.name
            );

            expect(ourFamilies.length).toBe(0);
        });
    });
});
