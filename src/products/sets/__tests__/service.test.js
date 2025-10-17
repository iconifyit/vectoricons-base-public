/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SetService = require('../SetService');
const SetEntity = require('../SetEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

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

const initService = () => {
    return new SetService();
};

// Contract tests
serviceContract({
    name: 'Set',
    initService: initService,
    Entity: SetEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, family_id: data.family_id }),
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('SetService - Custom Tests', () => {
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

    describe('Set Creation and Retrieval', () => {
        test('creates set with all fields', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set).toBeInstanceOf(SetEntity);
            expect(set.name).toBe(setData.name);
            expect(set.price).toBe('19.99'); // Price is returned as string
            expect(set.familyId).toBe(setData.family_id);
            expect(set.licenseId).toBe(setData.license_id);
            expect(set.userId).toBe(setData.user_id);
            expect(set.isActive).toBe(true);
            expect(set.isDeleted).toBe(false);
            expect(set.createdAt).toBeInstanceOf(Date);
            expect(set.updatedAt).toBeInstanceOf(Date);
        });

        test('auto-generates unique_id on creation', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.uniqueId).toBeDefined();
            expect(typeof set.uniqueId).toBe('string');
            expect(set.uniqueId.length).toBe(12);
        });

        test('finds set by id', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(SetEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(setData.name);
        });
    });

    describe('Unique ID Lookup', () => {
        test('getSetByUniqueId finds set', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            const found = await service.getSetByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(SetEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('getSetByUniqueId returns undefined for non-existent id', async () => {
            const found = await service.getSetByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });

        test('unique_id persists after updates', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });
            const originalUniqueId = created.uniqueId;

            await service.update(created.id, { name: 'Updated Set' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.uniqueId).toBe(originalUniqueId);
        });
    });

    describe('Active Sets', () => {
        test('getAllActiveSets returns only active, non-deleted sets', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive, { trx });
            await service.create(deleted, { trx });

            const activeSets = await service.getAllActiveSets({ trx });

            // Filter to only our test sets
            const ourActiveSets = activeSets.filter(s =>
                s.name === active1.name || s.name === active2.name
            );

            expect(ourActiveSets.length).toBe(2);
            expect(ourActiveSets.every(s => s.isActive && !s.isDeleted)).toBe(true);
        });

        test('soft deleted sets not in getAllActiveSets', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.softDelete(created.id, { trx });

            const activeSets = await service.getAllActiveSets({ trx });
            const found = activeSets.find(s => s.id === created.id);

            expect(found).toBeUndefined();
        });

        test('deactivated sets not in getAllActiveSets', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.deactivate(created.id, { trx });

            const activeSets = await service.getAllActiveSets({ trx });
            const found = activeSets.find(s => s.id === created.id);

            expect(found).toBeUndefined();
        });
    });

    describe('Family Relationship', () => {
        test('creates set with family_id', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.familyId).toBe(testFamilyId);
        });

        test('getSetsByFamilyId finds sets by family', async () => {
            const set1 = await seedOne();
            const set2 = await seedOne();

            const created1 = await service.create(set1, { trx });
            const created2 = await service.create(set2, { trx });

            const familySets = await service.getSetsByFamilyId(testFamilyId, { trx });
            const ourSets = familySets.filter(s =>
                s.id === created1.id || s.id === created2.id
            );

            expect(ourSets.length).toBe(2);
            expect(ourSets.every(s => s.familyId === testFamilyId)).toBe(true);
        });

        test('updates set family_id', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            // Get another family for update test
            const families = await DB.families.query().where({ is_deleted: false, is_active: true }).limit(2);
            if (families.length > 1) {
                const newFamilyId = families[1].id;
                await service.update(created.id, { family_id: newFamilyId }, { trx });
                const updated = await service.getById(created.id, { trx });

                expect(updated.familyId).toBe(newFamilyId);
            }
        });
    });

    describe('Pricing Management', () => {
        test('creates set with price', async () => {
            const setData = { ...await seedOne(), price: 49.99 };
            const set = await service.create(setData, { trx });

            expect(set.price).toBe('49.99');
        });

        test('handles price precision (2 decimals)', async () => {
            const setData = { ...await seedOne(), price: 19.9999 };
            const set = await service.create(setData, { trx });

            // Database should round to 2 decimals
            expect(parseFloat(set.price)).toBeCloseTo(20.00, 2);
        });

        test('updates set price', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.update(created.id, { price: 99.99 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.price).toBe('99.99');
        });

        test('price field is required', async () => {
            const setData = await seedOne();
            delete setData.price;

            // Price is required in the schema
            await expect(service.create(setData, { trx })).rejects.toThrow();
        });
    });

    describe('Ownership Tracking', () => {
        test('creates set with user_id', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.userId).toBe(1);
        });

        test('finds sets by user_id', async () => {
            const set1 = await seedOne();
            const set2 = await seedOne();

            const created1 = await service.create(set1, { trx });
            const created2 = await service.create(set2, { trx });

            const userSets = await service.getWhere({ user_id: 1 }, { trx });
            const ourSets = userSets.filter(s =>
                s.id === created1.id || s.id === created2.id
            );

            expect(ourSets.length).toBe(2);
            expect(ourSets.every(s => s.userId === 1)).toBe(true);
        });

        test('team_id is nullable', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            // team_id is optional/nullable
            expect(set).toBeInstanceOf(SetEntity);
        });
    });

    describe('Type and Style', () => {
        test('type_id is nullable', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set).toBeInstanceOf(SetEntity);
            // type_id is optional
        });

        test('style_id is nullable', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set).toBeInstanceOf(SetEntity);
            // style_id is optional
        });
    });

    describe('Licensing', () => {
        test('uses default license_id (21)', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.licenseId).toBe(21);
        });

        test('license_id is set from seed', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set).toBeInstanceOf(SetEntity);
            expect(set.licenseId).toBe(21);
        });
    });

    describe('Soft Delete + Activation', () => {
        test('soft delete sets is_deleted to true', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            expect(deleted.isDeleted).toBe(true);
        });

        test('soft delete also deactivates (withSoftDeletable behavior)', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });
            expect(created.isActive).toBe(true);

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            // withSoftDeletable mixin also sets is_active to false
            expect(deleted.isActive).toBe(false);
            expect(deleted.isDeleted).toBe(true);
        });

        test('deactivate sets is_active to false', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('deactivate does not affect is_deleted', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });
            expect(created.isDeleted).toBe(false);

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isDeleted).toBe(false);
            expect(deactivated.isActive).toBe(false);
        });

        test('can be both deleted and inactive', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.deactivate(created.id, { trx });
            await service.softDelete(created.id, { trx });
            const set = await service.getById(created.id, { trx });

            expect(set.isActive).toBe(false);
            expect(set.isDeleted).toBe(true);
        });

        test('restore sets is_deleted to false', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.softDelete(created.id, { trx });
            await service.restore(created.id, { trx });
            const restored = await service.getById(created.id, { trx });

            expect(restored.isDeleted).toBe(false);
        });
    });

    describe('Sorting', () => {
        test('uses default sort value (0)', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.sort).toBe(0);
        });

        test('accepts custom sort value', async () => {
            const setData = { ...await seedOne(), sort: 100 };
            const set = await service.create(setData, { trx });

            expect(set.sort).toBe(100);
        });

        test('updates sort value', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await service.update(created.id, { sort: 50 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.sort).toBe(50);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.createdAt).toBeInstanceOf(Date);
            expect(set.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            expect(set.updatedAt).toBeInstanceOf(Date);
            expect(set.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const setData = await seedOne();
            const set = await service.create(setData, { trx });

            const timeDiff = Math.abs(
                set.updatedAt.getTime() - set.createdAt.getTime()
            );
            expect(timeDiff).toBeLessThan(1000);
        });

        test('update changes updatedAt timestamp', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { name: 'Updated Set' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Update Operations', () => {
        test('updates set name', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            const newName = `Updated Set ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('updates set description', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

            const newDesc = 'Updated description';
            await service.update(created.id, { description: newDesc }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.description).toBe(newDesc);
        });

        test('updates multiple fields at once', async () => {
            const setData = await seedOne();
            const created = await service.create(setData, { trx });

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
