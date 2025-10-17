/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ProductTypeService = require('../ProductTypeService');
const ProductTypeEntity = require('../ProductTypeEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        value: `product_type_${testCounter}`,
        label: `Product Type ${testCounter}`,
        is_active: true,
    };
};

const initService = () => {
    return new ProductTypeService();
};

// Contract tests
serviceContract({
    name: 'ProductType',
    initService: initService,
    Entity: ProductTypeEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: false,
});

// Custom tests
describe('ProductTypeService - Custom Tests', () => {
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

    describe('Unique Value Constraint', () => {
        test('creates product type with unique value', async () => {
            const typeData = await seedOne();
            const productType = await service.create(typeData, { trx });

            expect(productType).toBeInstanceOf(ProductTypeEntity);
            expect(productType.value).toBe(typeData.value);
            expect(productType.label).toBe(typeData.label);
            expect(productType.isActive).toBe(true);
        });

        test('prevents duplicate value creation', async () => {
            const typeData = await seedOne();
            await service.create(typeData, { trx });

            // Attempt to create another product type with same value
            const duplicateData = {
                value: typeData.value,
                label: 'Different Label',
                is_active: true,
            };

            await expect(
                service.create(duplicateData, { trx })
            ).rejects.toThrow();
        });

        test('allows same label with different value', async () => {
            const type1Data = await seedOne();
            const type1 = await service.create(type1Data, { trx });

            const type2Data = {
                value: `different_value_${testCounter}`,
                label: type1Data.label, // Same label
                is_active: true,
            };
            const type2 = await service.create(type2Data, { trx });

            expect(type2).toBeInstanceOf(ProductTypeEntity);
            expect(type2.label).toBe(type1.label);
            expect(type2.value).not.toBe(type1.value);
        });
    });

    describe('Activation Management', () => {
        test('creates product type as active by default', async () => {
            const typeData = await seedOne();
            const productType = await service.create(typeData, { trx });

            expect(productType.isActive).toBe(true);
        });

        test('deactivates product type', async () => {
            const typeData = await seedOne();
            const productType = await service.create(typeData, { trx });

            await service.deactivate(productType.id, { trx });
            const deactivated = await service.getById(productType.id, { trx });

            expect(deactivated.isActive).toBe(false);
        });

        test('reactivates product type', async () => {
            const typeData = {
                ...await seedOne(),
                is_active: false,
            };
            const productType = await service.create(typeData, { trx });
            expect(productType.isActive).toBe(false);

            await service.activate(productType.id, { trx });
            const activated = await service.getById(productType.id, { trx });

            expect(activated.isActive).toBe(true);
        });

        test('toggles product type active state', async () => {
            const typeData = await seedOne();
            const productType = await service.create(typeData, { trx });
            expect(productType.isActive).toBe(true);

            await service.toggleActive(productType.id, { trx });
            const toggled = await service.getById(productType.id, { trx });
            expect(toggled.isActive).toBe(false);

            await service.toggleActive(productType.id, { trx });
            const toggledAgain = await service.getById(productType.id, { trx });
            expect(toggledAgain.isActive).toBe(true);
        });

        test('getActive returns only active product types', async () => {
            const type1Data = await seedOne();
            const type2Data = { ...await seedOne(), is_active: false };
            const type3Data = await seedOne();

            await service.create(type1Data, { trx });
            await service.create(type2Data, { trx });
            await service.create(type3Data, { trx });

            const activeTypes = await service.getActive({}, { trx });
            const activeCount = activeTypes.filter(t =>
                t.value === type1Data.value ||
                t.value === type3Data.value
            ).length;

            expect(activeCount).toBe(2);
            expect(activeTypes.every(t => t.isActive)).toBe(true);
        });
    });

    describe('Lookup Operations', () => {
        test('finds product type by value', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const found = await service.getOne({ value: typeData.value }, { trx });
            expect(found).toBeInstanceOf(ProductTypeEntity);
            expect(found.id).toBe(created.id);
            expect(found.value).toBe(typeData.value);
        });

        test('finds product type by label', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const found = await service.getOne({ label: typeData.label }, { trx });
            expect(found).toBeInstanceOf(ProductTypeEntity);
            expect(found.id).toBe(created.id);
            expect(found.label).toBe(typeData.label);
        });

        test('filters by isActive', async () => {
            const activeData = await seedOne();
            const inactiveData = { ...await seedOne(), is_active: false };

            await service.create(activeData, { trx });
            await service.create(inactiveData, { trx });

            const activeTypes = await service.getWhere({ is_active: true }, { trx });
            const inactiveTypes = await service.getWhere({ is_active: false }, { trx });

            expect(activeTypes.some(t => t.value === activeData.value)).toBe(true);
            expect(inactiveTypes.some(t => t.value === inactiveData.value)).toBe(true);
        });

        test('returns undefined for non-existent value', async () => {
            const found = await service.getOne({ value: 'nonexistent_value' }, { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('Bulk Operations', () => {
        test('creates multiple product types', async () => {
            const type1Data = await seedOne();
            const type2Data = await seedOne();
            const type3Data = await seedOne();

            const type1 = await service.create(type1Data, { trx });
            const type2 = await service.create(type2Data, { trx });
            const type3 = await service.create(type3Data, { trx });

            expect(type1).toBeInstanceOf(ProductTypeEntity);
            expect(type2).toBeInstanceOf(ProductTypeEntity);
            expect(type3).toBeInstanceOf(ProductTypeEntity);

            const allTypes = await service.getAll({ trx });
            expect(allTypes.length).toBeGreaterThanOrEqual(3);
        });

        test('filters product types by active status', async () => {
            const active1 = await seedOne();
            const active2 = await seedOne();
            const inactive1 = { ...await seedOne(), is_active: false };

            await service.create(active1, { trx });
            await service.create(active2, { trx });
            await service.create(inactive1, { trx });

            const activeTypes = await service.getActive({}, { trx });
            const allTypes = await service.getAll({ trx });

            expect(allTypes.length).toBeGreaterThanOrEqual(3);
            expect(activeTypes.every(t => t.isActive)).toBe(true);
        });
    });

    describe('Update Operations', () => {
        test('updates product type label', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const newLabel = 'Updated Label';
            await service.update(created.id, { label: newLabel }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.label).toBe(newLabel);
            expect(updated.value).toBe(typeData.value);
        });

        test('prevents updating to duplicate value', async () => {
            const type1Data = await seedOne();
            const type2Data = await seedOne();

            const type1 = await service.create(type1Data, { trx });
            const type2 = await service.create(type2Data, { trx });

            // Attempt to update type2 to have type1's value
            await expect(
                service.update(type2.id, { value: type1.value }, { trx })
            ).rejects.toThrow();
        });
    });
});
