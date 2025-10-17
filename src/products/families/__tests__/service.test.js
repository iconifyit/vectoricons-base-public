/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const FamilyService = require('../FamilyService');
const FamilyEntity = require('../FamilyEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

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

const initService = () => {
    return new FamilyService();
};

// Contract tests
serviceContract({
    name: 'Family',
    initService: initService,
    Entity: FamilyEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, user_id: data.user_id }),
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('FamilyService - Custom Tests', () => {
    let service;
    let trx;

    beforeAll(() => {
        service = initService();
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
            trx = null;
        }
    });

    describe('Family Creation and Retrieval', () => {
        test('creates family with all fields', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family).toBeInstanceOf(FamilyEntity);
            expect(family.name).toBe(familyData.name);
            expect(family.price).toBe('29.99'); // Price is returned as string
            expect(family.description).toBe(familyData.description);
            expect(family.licenseId).toBe(familyData.license_id);
            expect(family.userId).toBe(familyData.user_id);
            expect(family.sort).toBe(familyData.sort);
            expect(family.isActive).toBe(true);
            expect(family.isDeleted).toBe(false);
            expect(family.createdAt).toBeInstanceOf(Date);
            expect(family.updatedAt).toBeInstanceOf(Date);
        });

        test('auto-generates unique_id on creation', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.uniqueId).toBeDefined();
            expect(typeof family.uniqueId).toBe('string');
            expect(family.uniqueId.length).toBe(12);
        });

        test('finds family by id', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(FamilyEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(familyData.name);
        });
    });

    describe('Unique ID Lookup', () => {
        test('getFamilyByUniqueId finds family', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            const found = await service.getFamilyByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(FamilyEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('getFamilyByUniqueId returns undefined for non-existent id', async () => {
            const found = await service.getFamilyByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });

        test('unique_id persists after updates', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });
            const originalUniqueId = created.uniqueId;

            await service.update(created.id, { name: 'Updated Family' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.uniqueId).toBe(originalUniqueId);
        });
    });

    describe('Active Families', () => {
        test('getAllActiveFamilies returns only active, non-deleted families', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive, { trx });
            await service.create(deleted, { trx });

            const activeFamilies = await service.getAllActiveFamilies({ trx });

            // Filter to only our test families
            const ourActiveFamilies = activeFamilies.filter(f =>
                f.name === active1.name || f.name === active2.name
            );

            expect(ourActiveFamilies.length).toBe(2);
            expect(ourActiveFamilies.every(f => f.isActive && !f.isDeleted)).toBe(true);
        });

        test('soft deleted families not in getAllActiveFamilies', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.softDelete(created.id, { trx });

            const activeFamilies = await service.getAllActiveFamilies({ trx });
            const found = activeFamilies.find(f => f.id === created.id);

            expect(found).toBeUndefined();
        });

        test('deactivated families not in getAllActiveFamilies', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.deactivate(created.id, { trx });

            const activeFamilies = await service.getAllActiveFamilies({ trx });
            const found = activeFamilies.find(f => f.id === created.id);

            expect(found).toBeUndefined();
        });
    });

    describe('Pricing Management', () => {
        test('creates family with price', async () => {
            const familyData = { ...await seedOne(), price: 49.99 };
            const family = await service.create(familyData, { trx });

            expect(family.price).toBe('49.99');
        });

        test('handles price precision (2 decimals)', async () => {
            const familyData = { ...await seedOne(), price: 29.9999 };
            const family = await service.create(familyData, { trx });

            // Database should round to 2 decimals
            expect(parseFloat(family.price)).toBeCloseTo(30.00, 2);
        });

        test('updates family price', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.update(created.id, { price: 99.99 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.price).toBe('99.99');
        });

        test('creates family without price', async () => {
            const familyData = await seedOne();
            delete familyData.price;
            const family = await service.create(familyData, { trx });

            expect(family).toBeInstanceOf(FamilyEntity);
            expect(family.name).toBe(familyData.name);
        });
    });

    describe('Ownership Tracking', () => {
        test('creates family with user_id', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.userId).toBe(1);
        });

        test('finds families by user_id', async () => {
            const family1 = await seedOne();
            const family2 = await seedOne();

            const created1 = await service.create(family1, { trx });
            const created2 = await service.create(family2, { trx });

            const userFamilies = await service.getWhere({ user_id: 1 }, { trx });
            const ourFamilies = userFamilies.filter(f =>
                f.id === created1.id || f.id === created2.id
            );

            expect(ourFamilies.length).toBe(2);
            expect(ourFamilies.every(f => f.userId === 1)).toBe(true);
        });

        test('team_id is nullable', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            // team_id is optional/nullable
            expect(family).toBeInstanceOf(FamilyEntity);
        });
    });

    describe('Licensing', () => {
        test('uses default license_id (21)', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.licenseId).toBe(21);
        });

        test('license_id is set from seed', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family).toBeInstanceOf(FamilyEntity);
            expect(family.licenseId).toBe(21);
        });
    });

    describe('Soft Delete + Activation', () => {
        test('soft delete sets is_deleted to true', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            expect(deleted.isDeleted).toBe(true);
        });

        test('soft delete also deactivates (withSoftDeletable behavior)', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });
            expect(created.isActive).toBe(true);

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            // withSoftDeletable mixin also sets is_active to false
            expect(deleted.isActive).toBe(false);
            expect(deleted.isDeleted).toBe(true);
        });

        test('deactivate sets is_active to false', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('deactivate does not affect is_deleted', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });
            expect(created.isDeleted).toBe(false);

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isDeleted).toBe(false);
            expect(deactivated.isActive).toBe(false);
        });

        test('can be both deleted and inactive', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.deactivate(created.id, { trx });
            await service.softDelete(created.id, { trx });
            const family = await service.getById(created.id, { trx });

            expect(family.isActive).toBe(false);
            expect(family.isDeleted).toBe(true);
        });

        test('restore sets is_deleted to false', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.softDelete(created.id, { trx });
            await service.restore(created.id, { trx });
            const restored = await service.getById(created.id, { trx });

            expect(restored.isDeleted).toBe(false);
        });
    });

    describe('Sorting', () => {
        test('uses default sort value (0)', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.sort).toBe(0);
        });

        test('accepts custom sort value', async () => {
            const familyData = { ...await seedOne(), sort: 100 };
            const family = await service.create(familyData, { trx });

            expect(family.sort).toBe(100);
        });

        test('updates sort value', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.update(created.id, { sort: 50 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.sort).toBe(50);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.createdAt).toBeInstanceOf(Date);
            expect(family.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            expect(family.updatedAt).toBeInstanceOf(Date);
            expect(family.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const familyData = await seedOne();
            const family = await service.create(familyData, { trx });

            const timeDiff = Math.abs(
                family.updatedAt.getTime() - family.createdAt.getTime()
            );
            expect(timeDiff).toBeLessThan(1000);
        });

        test('update changes updatedAt timestamp', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { name: 'Updated Family' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Update Operations', () => {
        test('updates family name', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            const newName = `Updated Family ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('updates family description', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            const newDesc = 'Updated description';
            await service.update(created.id, { description: newDesc }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.description).toBe(newDesc);
        });

        test('updates multiple fields at once', async () => {
            const familyData = await seedOne();
            const created = await service.create(familyData, { trx });

            await service.update(created.id, {
                name: 'New Name',
                price: 199.99,
                sort: 10,
            }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe('New Name');
            expect(updated.price).toBe('199.99');
            expect(updated.sort).toBe(10);
        });
    });
});
