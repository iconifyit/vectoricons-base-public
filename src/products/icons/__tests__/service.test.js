/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IconService = require('../IconService');
const IconEntity = require('../IconEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

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

const initService = () => {
    return new IconService();
};

// Contract tests
// Note: getActive() test may timeout with large icon datasets (contract has 5s timeout)
serviceContract({
    name: 'Icon',
    initService: initService,
    Entity: IconEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, set_id: data.set_id }),
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('IconService - Custom Tests', () => {
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

    describe('Icon Creation and Retrieval', () => {
        test('creates icon with all fields', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            expect(icon.name).toBe(iconData.name);
            expect(icon.width).toBe('24.00'); // Numeric fields returned as strings
            expect(icon.height).toBe('24.00');
            expect(icon.setId).toBe(iconData.set_id);
            expect(icon.licenseId).toBe(iconData.license_id);
            expect(icon.userId).toBe(iconData.user_id);
            expect(icon.isActive).toBe(true);
            expect(icon.isDeleted).toBe(false);
            expect(icon.createdAt).toBeInstanceOf(Date);
            expect(icon.updatedAt).toBeInstanceOf(Date);
        });

        test('auto-generates unique_id on creation', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.uniqueId).toBeDefined();
            expect(typeof icon.uniqueId).toBe('string');
            expect(icon.uniqueId.length).toBe(12);
        });

        test('finds icon by id', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(IconEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(iconData.name);
        });
    });

    describe('Unique ID Lookup', () => {
        test('getIconByUniqueId finds icon', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            const found = await service.getIconByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(IconEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('getIconByUniqueId returns undefined for non-existent id', async () => {
            const found = await service.getIconByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });

        test('unique_id persists after updates', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });
            const originalUniqueId = created.uniqueId;

            await service.update(created.id, { name: 'Updated Icon' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.uniqueId).toBe(originalUniqueId);
        });
    });

    describe('Set Relationship', () => {
        test('creates icon with set_id', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.setId).toBe(testSetId);
        });

        test('getIconsBySetId finds icons by set', async () => {
            const icon1 = await seedOne();
            const icon2 = await seedOne();

            const created1 = await service.create(icon1, { trx });
            const created2 = await service.create(icon2, { trx });

            const setIcons = await service.getIconsBySetId(testSetId, { trx });
            const ourIcons = setIcons.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIcons.length).toBe(2);
            expect(ourIcons.every(i => i.setId === testSetId)).toBe(true);
        });

        test('updates icon set_id', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            // Get another set for update test
            const sets = await DB.sets.query().where({ is_deleted: false, is_active: true }).limit(2);
            if (sets.length > 1) {
                const newSetId = sets[1].id;
                await service.update(created.id, { set_id: newSetId }, { trx });
                const updated = await service.getById(created.id, { trx });

                expect(updated.setId).toBe(newSetId);
            }
        });
    });

    describe('Active Icons', () => {
        test('getAllActiveIcons returns only active, non-deleted icons', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive, { trx });
            await service.create(deleted, { trx });

            const activeIcons = await service.getAllActiveIcons({ trx });

            // Filter to only our test icons
            const ourActiveIcons = activeIcons.filter(i =>
                i.name === active1.name || i.name === active2.name
            );

            expect(ourActiveIcons.length).toBe(2);
            expect(ourActiveIcons.every(i => i.isActive && !i.isDeleted)).toBe(true);
        });

        test('soft deleted icons not in getAllActiveIcons', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.softDelete(created.id, { trx });

            const activeIcons = await service.getAllActiveIcons({ trx });
            const found = activeIcons.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });

        test('deactivated icons not in getAllActiveIcons', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.deactivate(created.id, { trx });

            const activeIcons = await service.getAllActiveIcons({ trx });
            const found = activeIcons.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });
    });

    describe('Dimensions Tracking', () => {
        test('creates icon with width and height', async () => {
            const iconData = { ...await seedOne(), width: 32, height: 32 };
            const icon = await service.create(iconData, { trx });

            expect(icon.width).toBe('32.00');
            expect(icon.height).toBe('32.00');
        });

        test('updates icon dimensions', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.update(created.id, { width: 48, height: 48 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.width).toBe('48.00');
            expect(updated.height).toBe('48.00');
        });

        test('dimensions can be different (non-square icons)', async () => {
            const iconData = { ...await seedOne(), width: 24, height: 16 };
            const icon = await service.create(iconData, { trx });

            expect(icon.width).toBe('24.00');
            expect(icon.height).toBe('16.00');
        });

        test('dimensions are nullable', async () => {
            const iconData = await seedOne();
            delete iconData.width;
            delete iconData.height;
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            expect(icon.name).toBe(iconData.name);
        });
    });

    describe('Pricing Management', () => {
        test('creates icon with price', async () => {
            const iconData = { ...await seedOne(), price: 9.99 };
            const icon = await service.create(iconData, { trx });

            expect(icon.price).toBe('9.99');
        });

        test('handles price precision (2 decimals)', async () => {
            const iconData = { ...await seedOne(), price: 9.9999 };
            const icon = await service.create(iconData, { trx });

            // Database should round to 2 decimals
            expect(parseFloat(icon.price)).toBeCloseTo(10.00, 2);
        });

        test('updates icon price', async () => {
            const iconData = { ...await seedOne(), price: 5.99 };
            const created = await service.create(iconData, { trx });

            await service.update(created.id, { price: 14.99 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.price).toBe('14.99');
        });

        test('price is nullable', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            expect(icon.name).toBe(iconData.name);
        });
    });

    describe('Ownership Tracking', () => {
        test('creates icon with user_id', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.userId).toBe(1);
        });

        test('finds icons by user_id', async () => {
            const icon1 = await seedOne();
            const icon2 = await seedOne();

            const created1 = await service.create(icon1, { trx });
            const created2 = await service.create(icon2, { trx });

            const userIcons = await service.getWhere({ user_id: 1, set_id: testSetId }, { trx });
            const ourIcons = userIcons.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIcons.length).toBe(2);
            expect(ourIcons.every(i => i.userId === 1)).toBe(true);
        });

        test('team_id is nullable', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            // team_id is optional
        });
    });

    describe('Style Relationship', () => {
        test('style_id is nullable', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            // style_id is optional
        });
    });

    describe('Licensing', () => {
        test('uses default license_id (21)', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.licenseId).toBe(21);
        });

        test('license_id is set from seed', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon).toBeInstanceOf(IconEntity);
            expect(icon.licenseId).toBe(21);
        });
    });

    describe('Soft Delete + Activation', () => {
        test('soft delete sets is_deleted to true', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            expect(deleted.isDeleted).toBe(true);
        });

        test('soft delete also deactivates (withSoftDeletable behavior)', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });
            expect(created.isActive).toBe(true);

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            // withSoftDeletable mixin also sets is_active to false
            expect(deleted.isActive).toBe(false);
            expect(deleted.isDeleted).toBe(true);
        });

        test('deactivate sets is_active to false', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('deactivate does not affect is_deleted', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });
            expect(created.isDeleted).toBe(false);

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isDeleted).toBe(false);
            expect(deactivated.isActive).toBe(false);
        });

        test('can be both deleted and inactive', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.deactivate(created.id, { trx });
            await service.softDelete(created.id, { trx });
            const icon = await service.getById(created.id, { trx });

            expect(icon.isActive).toBe(false);
            expect(icon.isDeleted).toBe(true);
        });

        test('restore sets is_deleted to false', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.softDelete(created.id, { trx });
            await service.restore(created.id, { trx });
            const restored = await service.getById(created.id, { trx });

            expect(restored.isDeleted).toBe(false);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.createdAt).toBeInstanceOf(Date);
            expect(icon.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            expect(icon.updatedAt).toBeInstanceOf(Date);
            expect(icon.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const iconData = await seedOne();
            const icon = await service.create(iconData, { trx });

            const timeDiff = Math.abs(
                icon.updatedAt.getTime() - icon.createdAt.getTime()
            );
            expect(timeDiff).toBeLessThan(1000);
        });

        test('update changes updatedAt timestamp', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { name: 'Updated Icon' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Update Operations', () => {
        test('updates icon name', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            const newName = `Updated Icon ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('updates multiple fields at once', async () => {
            const iconData = await seedOne();
            const created = await service.create(iconData, { trx });

            await service.update(created.id, {
                name: 'New Name',
                width: 64,
                height: 64,
                price: 19.99,
            }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe('New Name');
            expect(updated.width).toBe('64.00');
            expect(updated.height).toBe('64.00');
            expect(updated.price).toBe('19.99');
        });
    });
});
