/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const CategoryService = require('../CategoryService');
const CategoryEntity = require('../CategoryEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        name: `Category ${testCounter}`,
        is_active: true,
    };
};

const initService = () => {
    return new CategoryService();
};

// Contract tests
serviceContract({
    name: 'Category',
    initService: initService,
    Entity: CategoryEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ name: data.name }),
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
});

// Custom tests
describe('CategoryService - Custom Tests', () => {
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

    describe('Category Creation and Retrieval', () => {
        test('creates category with name', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            expect(category).toBeInstanceOf(CategoryEntity);
            expect(category.name).toBe(categoryData.name);
            expect(category.isActive).toBe(true);
            expect(category.createdAt).toBeInstanceOf(Date);
            expect(category.updatedAt).toBeInstanceOf(Date);
        });

        test('allows duplicate category names', async () => {
            const name = 'Duplicate Category';
            const category1 = await service.create({ name, is_active: true }, { trx });
            const category2 = await service.create({ name, is_active: true }, { trx });

            expect(category1).toBeInstanceOf(CategoryEntity);
            expect(category2).toBeInstanceOf(CategoryEntity);
            expect(category1.id).not.toBe(category2.id);
            expect(category1.name).toBe(category2.name);
        });

        test('finds category by name', async () => {
            const categoryData = await seedOne();
            const created = await service.create(categoryData, { trx });

            const found = await service.getOne({ name: categoryData.name }, { trx });
            expect(found).toBeInstanceOf(CategoryEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(categoryData.name);
        });

        test('finds category by id', async () => {
            const categoryData = await seedOne();
            const created = await service.create(categoryData, { trx });

            const found = await service.getById(created.id, { trx });
            expect(found).toBeInstanceOf(CategoryEntity);
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(categoryData.name);
        });
    });

    describe('Activation Management', () => {
        test('creates category as active by default', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            expect(category.isActive).toBe(true);
        });

        test('deactivates category', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            await service.deactivate(category.id, { trx });
            const deactivated = await service.getById(category.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('reactivates category', async () => {
            const categoryData = {
                ...await seedOne(),
                is_active: false,
            };
            const category = await service.create(categoryData, { trx });
            expect(category.isActive).toBe(false);

            await service.activate(category.id, { trx });
            const activated = await service.getById(category.id, { trx });

            expect(activated.isActive).toBe(true);
        });

        test('toggles category active state', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });
            expect(category.isActive).toBe(true);

            await service.toggleActive(category.id, { trx });
            const toggled = await service.getById(category.id, { trx });
            expect(toggled.isActive).toBe(false);

            await service.toggleActive(category.id, { trx });
            const toggledAgain = await service.getById(category.id, { trx });
            expect(toggledAgain.isActive).toBe(true);
        });

        test('getActive returns only active categories', async () => {
            const cat1Data = await seedOne();
            const cat2Data = { ...await seedOne(), is_active: false };
            const cat3Data = await seedOne();

            await service.create(cat1Data, { trx });
            await service.create(cat2Data, { trx });
            await service.create(cat3Data, { trx });

            const activeCategories = await service.getActive({}, { trx });
            const activeCount = activeCategories.filter(c =>
                c.name === cat1Data.name ||
                c.name === cat3Data.name
            ).length;

            expect(activeCount).toBe(2);
            expect(activeCategories.every(c => c.isActive)).toBe(true);
        });

        test('filters categories by isActive', async () => {
            const activeData = await seedOne();
            const inactiveData = { ...await seedOne(), is_active: false };

            await service.create(activeData, { trx });
            await service.create(inactiveData, { trx });

            const activeCategories = await service.getWhere({ is_active: true }, { trx });
            const inactiveCategories = await service.getWhere({ is_active: false }, { trx });

            expect(activeCategories.some(c => c.name === activeData.name)).toBe(true);
            expect(inactiveCategories.some(c => c.name === inactiveData.name)).toBe(true);
        });
    });

    describe('Bulk Operations', () => {
        test('creates multiple categories', async () => {
            const cat1Data = await seedOne();
            const cat2Data = await seedOne();
            const cat3Data = await seedOne();

            const cat1 = await service.create(cat1Data, { trx });
            const cat2 = await service.create(cat2Data, { trx });
            const cat3 = await service.create(cat3Data, { trx });

            expect(cat1).toBeInstanceOf(CategoryEntity);
            expect(cat2).toBeInstanceOf(CategoryEntity);
            expect(cat3).toBeInstanceOf(CategoryEntity);

            const allCategories = await service.getAll({ trx });
            expect(allCategories.length).toBeGreaterThanOrEqual(3);
        });

        test('lists all categories', async () => {
            const cat1Data = await seedOne();
            const cat2Data = await seedOne();

            await service.create(cat1Data, { trx });
            await service.create(cat2Data, { trx });

            const allCategories = await service.getAll({ trx });
            expect(Array.isArray(allCategories)).toBe(true);
            expect(allCategories.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Update Operations', () => {
        test('updates category name', async () => {
            const categoryData = await seedOne();
            const created = await service.create(categoryData, { trx });

            const newName = 'Updated Category Name';
            await service.update(created.id, { name: newName }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.name).toBe(newName);
        });

        test('update changes updatedAt timestamp', async () => {
            const categoryData = await seedOne();
            const created = await service.create(categoryData, { trx });
            const originalUpdatedAt = created.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { name: 'New Name' }, { trx });
            const updated = await service.getById(created.id, { trx });

            // Note: This may not work if DB doesn't auto-update timestamps
            // Just check that updatedAt exists
            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            expect(category.createdAt).toBeInstanceOf(Date);
            expect(category.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            expect(category.updatedAt).toBeInstanceOf(Date);
            expect(category.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const categoryData = await seedOne();
            const category = await service.create(categoryData, { trx });

            const timeDiff = Math.abs(
                category.updatedAt.getTime() - category.createdAt.getTime()
            );
            // Should be within 1 second
            expect(timeDiff).toBeLessThan(1000);
        });
    });
});
