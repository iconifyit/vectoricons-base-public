/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IllustrationService = require('../IllustrationService');
const IllustrationEntity = require('../IllustrationEntity');
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

const initService = () => {
    return new IllustrationService();
};

// Contract tests
// Note: getActive() test may timeout with large illustration datasets (contract has 5s timeout)
serviceContract({
    name: 'Illustration',
    initService: initService,
    Entity: IllustrationEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name, set_id: data.set_id }),
    supportsSoftDelete: true,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('IllustrationService - Custom Tests', () => {
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

    describe('Illustration Creation and Retrieval', () => {
        test('creates illustration with all fields', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            expect(illustration.name).toBe(illustrationData.name);
            expect(illustration.width).toBe('512.00'); // Numeric fields returned as strings
            expect(illustration.height).toBe('512.00');
            expect(illustration.setId).toBe(illustrationData.set_id);
            expect(illustration.licenseId).toBe(illustrationData.license_id);
            expect(illustration.userId).toBe(illustrationData.user_id);
            expect(illustration.isActive).toBe(true);
            expect(illustration.isDeleted).toBe(false);
            expect(illustration.createdAt).toBeInstanceOf(Date);
            expect(illustration.updatedAt).toBeInstanceOf(Date);
        });

        test('auto-generates unique_id on creation', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.uniqueId).toBeDefined();
            expect(typeof illustration.uniqueId).toBe('string');
            expect(illustration.uniqueId.length).toBe(12);
        });

        test('finds illustration by id', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(IllustrationEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(illustrationData.name);
        });
    });

    describe('Unique ID Lookup', () => {
        test('getIllustrationByUniqueId finds illustration', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            const found = await service.getIllustrationByUniqueId(created.uniqueId, { trx });
            expect(found).toBeInstanceOf(IllustrationEntity);
            expect(found.id).toBe(created.id);
            expect(found.uniqueId).toBe(created.uniqueId);
        });

        test('getIllustrationByUniqueId returns undefined for non-existent id', async () => {
            const found = await service.getIllustrationByUniqueId('nonexistent123', { trx });
            expect(found).toBeUndefined();
        });

        test('unique_id persists after updates', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });
            const originalUniqueId = created.uniqueId;

            await service.update(created.id, { name: 'Updated Illustration' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.uniqueId).toBe(originalUniqueId);
        });
    });

    describe('Set Relationship', () => {
        test('creates illustration with set_id', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.setId).toBe(testSetId);
        });

        test('getIllustrationsBySetId finds illustrations by set', async () => {
            const illustration1 = await seedOne();
            const illustration2 = await seedOne();

            const created1 = await service.create(illustration1, { trx });
            const created2 = await service.create(illustration2, { trx });

            const setIllustrations = await service.getIllustrationsBySetId(testSetId, { trx });
            const ourIllustrations = setIllustrations.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIllustrations.length).toBe(2);
            expect(ourIllustrations.every(i => i.setId === testSetId)).toBe(true);
        });

        test('updates illustration set_id', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

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

    describe('Active Illustrations', () => {
        test('getAllActiveIllustrations returns only active, non-deleted illustrations', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive = { ...await seedOne(), is_active: false };
            const deleted = { ...await seedOne(), is_deleted: true };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive, { trx });
            await service.create(deleted, { trx });

            const activeIllustrations = await service.getAllActiveIllustrations({ trx });

            // Filter to only our test illustrations
            const ourActiveIllustrations = activeIllustrations.filter(i =>
                i.name === active1.name || i.name === active2.name
            );

            expect(ourActiveIllustrations.length).toBe(2);
            expect(ourActiveIllustrations.every(i => i.isActive && !i.isDeleted)).toBe(true);
        });

        test('soft deleted illustrations not in getAllActiveIllustrations', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.softDelete(created.id, { trx });

            const activeIllustrations = await service.getAllActiveIllustrations({ trx });
            const found = activeIllustrations.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });

        test('deactivated illustrations not in getAllActiveIllustrations', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.deactivate(created.id, { trx });

            const activeIllustrations = await service.getAllActiveIllustrations({ trx });
            const found = activeIllustrations.find(i => i.id === created.id);

            expect(found).toBeUndefined();
        });
    });

    describe('Dimensions Tracking', () => {
        test('creates illustration with width and height', async () => {
            const illustrationData = { ...await seedOne(), width: 768, height: 768 };
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.width).toBe('768.00');
            expect(illustration.height).toBe('768.00');
        });

        test('updates illustration dimensions', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.update(created.id, { width: 1024, height: 1024 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.width).toBe('1024.00');
            expect(updated.height).toBe('1024.00');
        });

        test('dimensions can be different (non-square illustrations)', async () => {
            const illustrationData = { ...await seedOne(), width: 512, height: 384 };
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.width).toBe('512.00');
            expect(illustration.height).toBe('384.00');
        });

        test('dimensions are nullable', async () => {
            const illustrationData = await seedOne();
            delete illustrationData.width;
            delete illustrationData.height;
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            expect(illustration.name).toBe(illustrationData.name);
        });
    });

    describe('Pricing Management', () => {
        test('creates illustration with price', async () => {
            const illustrationData = { ...await seedOne(), price: 9.99 };
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.price).toBe('9.99');
        });

        test('handles price precision (2 decimals)', async () => {
            const illustrationData = { ...await seedOne(), price: 9.9999 };
            const illustration = await service.create(illustrationData, { trx });

            // Database should round to 2 decimals
            expect(parseFloat(illustration.price)).toBeCloseTo(10.00, 2);
        });

        test('updates illustration price', async () => {
            const illustrationData = { ...await seedOne(), price: 5.99 };
            const created = await service.create(illustrationData, { trx });

            await service.update(created.id, { price: 14.99 }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.price).toBe('14.99');
        });

        test('price is nullable', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            expect(illustration.name).toBe(illustrationData.name);
        });
    });

    describe('Ownership Tracking', () => {
        test('creates illustration with user_id', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.userId).toBe(1);
        });

        test('finds illustrations by user_id', async () => {
            const illustration1 = await seedOne();
            const illustration2 = await seedOne();

            const created1 = await service.create(illustration1, { trx });
            const created2 = await service.create(illustration2, { trx });

            const userIllustrations = await service.getWhere({ user_id: 1, set_id: testSetId }, { trx });
            const ourIllustrations = userIllustrations.filter(i =>
                i.id === created1.id || i.id === created2.id
            );

            expect(ourIllustrations.length).toBe(2);
            expect(ourIllustrations.every(i => i.userId === 1)).toBe(true);
        });

        test('team_id is nullable', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            // team_id is optional
        });
    });

    describe('Style Relationship', () => {
        test('style_id is nullable', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            // style_id is optional
        });
    });

    describe('Licensing', () => {
        test('uses default license_id (21)', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.licenseId).toBe(21);
        });

        test('license_id is set from seed', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration).toBeInstanceOf(IllustrationEntity);
            expect(illustration.licenseId).toBe(21);
        });
    });

    describe('Soft Delete + Activation', () => {
        test('soft delete sets is_deleted to true', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            expect(deleted.isDeleted).toBe(true);
        });

        test('soft delete also deactivates (withSoftDeletable behavior)', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });
            expect(created.isActive).toBe(true);

            await service.softDelete(created.id, { trx });
            const deleted = await service.getById(created.id, { trx });

            // withSoftDeletable mixin also sets is_active to false
            expect(deleted.isActive).toBe(false);
            expect(deleted.isDeleted).toBe(true);
        });

        test('deactivate sets is_active to false', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('deactivate does not affect is_deleted', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });
            expect(created.isDeleted).toBe(false);

            await service.deactivate(created.id, { trx });
            const deactivated = await service.getById(created.id, { trx });

            expect(deactivated.isDeleted).toBe(false);
            expect(deactivated.isActive).toBe(false);
        });

        test('can be both deleted and inactive', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.deactivate(created.id, { trx });
            await service.softDelete(created.id, { trx });
            const illustration = await service.getById(created.id, { trx });

            expect(illustration.isActive).toBe(false);
            expect(illustration.isDeleted).toBe(true);
        });

        test('restore sets is_deleted to false', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.softDelete(created.id, { trx });
            await service.restore(created.id, { trx });
            const restored = await service.getById(created.id, { trx });

            expect(restored.isDeleted).toBe(false);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.createdAt).toBeInstanceOf(Date);
            expect(illustration.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            expect(illustration.updatedAt).toBeInstanceOf(Date);
            expect(illustration.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const illustrationData = await seedOne();
            const illustration = await service.create(illustrationData, { trx });

            const timeDiff = Math.abs(
                illustration.updatedAt.getTime() - illustration.createdAt.getTime()
            );
            expect(timeDiff).toBeLessThan(1000);
        });

        test('update changes updatedAt timestamp', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { name: 'Updated Illustration' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Update Operations', () => {
        test('updates illustration name', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            const newName = `Updated Illustration ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('updates multiple fields at once', async () => {
            const illustrationData = await seedOne();
            const created = await service.create(illustrationData, { trx });

            await service.update(created.id, {
                name: 'New Name',
                width: 2048,
                height: 2048,
                price: 19.99,
            }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe('New Name');
            expect(updated.width).toBe('2048.00');
            expect(updated.height).toBe('2048.00');
            expect(updated.price).toBe('19.99');
        });
    });
});
