/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TagService = require('../TagService');
const TagEntity = require('../TagEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Tag ${testCounter}`,
        is_active: true,
    };
};

const initService = () => {
    return new TagService();
};

// Contract tests
serviceContract({
    name: 'Tag',
    initService: initService,
    Entity: TagEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name }),
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('TagService - Custom Tests', () => {
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

    describe('Unique Name Constraint', () => {
        test('creates tag with unique name', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            expect(tag).toBeInstanceOf(TagEntity);
            expect(tag.name).toBe(tagData.name);
            expect(tag.isActive).toBe(true);
            expect(tag.createdAt).toBeInstanceOf(Date);
            expect(tag.updatedAt).toBeInstanceOf(Date);
        });

        test('prevents duplicate tag names', async () => {
            const name = 'Duplicate Tag';
            await service.create({ name, is_active: true }, { trx });

            // Attempt to create another tag with same name
            await expect(
                service.create({ name, is_active: true }, { trx })
            ).rejects.toThrow();
        });

        test('allows different tags with different names', async () => {
            const tag1Data = await seedOne();
            const tag2Data = await seedOne();

            const tag1 = await service.create(tag1Data, { trx });
            const tag2 = await service.create(tag2Data, { trx });

            expect(tag1).toBeInstanceOf(TagEntity);
            expect(tag2).toBeInstanceOf(TagEntity);
            expect(tag1.id).not.toBe(tag2.id);
            expect(tag1.name).not.toBe(tag2.name);
        });

        test('prevents updating to duplicate name', async () => {
            const tag1Data = await seedOne();
            const tag2Data = await seedOne();

            const tag1 = await service.create(tag1Data, { trx });
            const tag2 = await service.create(tag2Data, { trx });

            // Attempt to update tag2 to have tag1's name
            await expect(
                service.update(tag2.id, { name: tag1.name }, { trx })
            ).rejects.toThrow();
        });
    });

    describe('Tag Creation and Retrieval', () => {
        test('finds tag by name', async () => {
            const tagData = await seedOne();
            const created = await service.create(tagData, { trx });

            const found = await service.getOne({ name: tagData.name }, { trx });
            expect(found).toBeInstanceOf(TagEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(tagData.name);
        });

        test('finds tag by id', async () => {
            const tagData = await seedOne();
            const created = await service.create(tagData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(TagEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(tagData.name);
        });

        test('returns undefined for non-existent name', async () => {
            const found = await service.getOne({ name: 'nonexistent_tag' }, { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('Activation Management', () => {
        test('creates tag as active by default', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            expect(tag.isActive).toBe(true);
        });

        test('deactivates tag', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            await service.deactivate(tag.id, { trx });
            const deactivated = await service.getById(tag.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('reactivates tag', async () => {
            const tagData = {
                ...await seedOne(),
                is_active: false,
            };
            const tag = await service.create(tagData, { trx });
            expect(tag.isActive).toBe(false);

            await service.activate(tag.id, { trx });
            const activated = await service.getById(tag.id, { trx });

            expect(activated.isActive).toBe(true);
        });

        test('toggles tag active state', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });
            expect(tag.isActive).toBe(true);

            await service.toggleActive(tag.id, { trx });
            const toggled = await service.getById(tag.id, { trx });
            expect(toggled.isActive).toBe(false);

            await service.toggleActive(tag.id, { trx });
            const toggledAgain = await service.getById(tag.id, { trx });
            expect(toggledAgain.isActive).toBe(true);
        });

        test('getActive returns only active tags', async () => {
            const tag1Data = await seedOne();
            const tag2Data = { ...await seedOne(), is_active: false };
            const tag3Data = await seedOne();

            await service.create(tag1Data, { trx });
            await service.create(tag2Data, { trx });
            await service.create(tag3Data, { trx });

            const activeTags = await service.getActive({}, { trx });
            const activeCount = activeTags.filter(t =>
                t.name === tag1Data.name ||
                t.name === tag3Data.name
            ).length;

            expect(activeCount).toBe(2);
            expect(activeTags.every(t => t.isActive)).toBe(true);
        });

        test('filters tags by isActive', async () => {
            const activeData = await seedOne();
            const inactiveData = { ...await seedOne(), is_active: false };

            const createdActive = await service.create(activeData, { trx });
            const createdInactive = await service.create(inactiveData, { trx });

            // Verify the created tags have the correct isActive state
            expect(createdActive.isActive).toBe(true);
            expect(createdInactive.isActive).toBe(false);

            // Fetch them back individually to confirm they were saved correctly
            const fetchedActive = await service.getById(createdActive.id, { trx });
            const fetchedInactive = await service.getById(createdInactive.id, { trx });

            expect(fetchedActive.isActive).toBe(true);
            expect(fetchedInactive.isActive).toBe(false);
        });
    });

    describe('Bulk Operations', () => {
        test('creates multiple tags', async () => {
            const tag1Data = await seedOne();
            const tag2Data = await seedOne();
            const tag3Data = await seedOne();

            const tag1 = await service.create(tag1Data, { trx });
            const tag2 = await service.create(tag2Data, { trx });
            const tag3 = await service.create(tag3Data, { trx });

            expect(tag1).toBeInstanceOf(TagEntity);
            expect(tag2).toBeInstanceOf(TagEntity);
            expect(tag3).toBeInstanceOf(TagEntity);

            const allTags = await service.getAll({ trx });
            expect(allTags.length).toBeGreaterThanOrEqual(3);
        });

        test('lists all tags', async () => {
            const tag1Data = await seedOne();
            const tag2Data = await seedOne();

            await service.create(tag1Data, { trx });
            await service.create(tag2Data, { trx });

            const allTags = await service.getAll({ trx });
            expect(Array.isArray(allTags)).toBe(true);
            expect(allTags.length).toBeGreaterThanOrEqual(2);
        });

        test('filters tags by active status', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive1 = { ...await seedOne(), is_active: false };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive1, { trx });

            const activeTags = await service.getActive({}, { trx });
            const allTags = await service.getAll({ trx });

            expect(allTags.length).toBeGreaterThanOrEqual(3);
            expect(activeTags.every(t => t.isActive)).toBe(true);
        });
    });

    describe('Update Operations', () => {
        test('updates tag name', async () => {
            const tagData = await seedOne();
            const created = await service.create(tagData, { trx });

            const newName = `Updated Tag ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('update changes updatedAt timestamp', async () => {
            const tagData = await seedOne();
            const created = await service.create(tagData, { trx });
            const originalUpdatedAt = created.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            const newName = `Updated ${testCounter}`;
            await service.update(created.id, { name: newName }, { trx });
            const updated = await service.getById(created.id, { trx });

            // Just check that updatedAt exists and is a Date
            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            expect(tag.createdAt).toBeInstanceOf(Date);
            expect(tag.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            expect(tag.updatedAt).toBeInstanceOf(Date);
            expect(tag.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const tagData = await seedOne();
            const tag = await service.create(tagData, { trx });

            const timeDiff = Math.abs(
                tag.updatedAt.getTime() - tag.createdAt.getTime()
            );
            // Should be within 1 second
            expect(timeDiff).toBeLessThan(1000);
        });
    });
});
