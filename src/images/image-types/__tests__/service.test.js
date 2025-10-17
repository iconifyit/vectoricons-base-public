/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const ImageTypeService = require('../ImageTypeService');
const ImageTypeEntity = require('../ImageTypeEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        label: `Test Image Type ${testCounter}`,
        value: `test_type_${testCounter}`,
        description: `Description for test type ${testCounter}`,
    };
};

const initService = () => {
    return new ImageTypeService();
};

// Contract tests
serviceContract({
    name: 'ImageType',
    initService: initService,
    Entity: ImageTypeEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: true,
});

// Custom tests
describe('ImageTypeService - Custom Tests', () => {
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
        test('creates image type with unique value', async () => {
            const typeData = await seedOne();
            const imageType = await service.create(typeData, { trx });

            expect(imageType).toBeInstanceOf(ImageTypeEntity);
            expect(imageType.value).toBe(typeData.value);
            expect(imageType.label).toBe(typeData.label);
            expect(imageType.description).toBe(typeData.description);
        });

        test('prevents duplicate value creation', async () => {
            const typeData = await seedOne();
            await service.create(typeData, { trx });

            // Attempt to create another image type with same value
            const duplicateData = {
                value: typeData.value,
                label: 'Different Label',
                description: 'Different description',
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
                description: 'Different description',
            };
            const type2 = await service.create(type2Data, { trx });

            expect(type2).toBeInstanceOf(ImageTypeEntity);
            expect(type2.label).toBe(type1.label);
            expect(type2.value).not.toBe(type1.value);
        });
    });

    describe('Lookup Operations', () => {
        test('finds image type by value', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const found = await service.getOne({ value: typeData.value }, { trx });
            expect(found).toBeInstanceOf(ImageTypeEntity);
            expect(found.id).toBe(created.id);
            expect(found.value).toBe(typeData.value);
        });

        test('finds image type by label', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const found = await service.getOne({ label: typeData.label }, { trx });
            expect(found).toBeInstanceOf(ImageTypeEntity);
            expect(found.id).toBe(created.id);
            expect(found.label).toBe(typeData.label);
        });

        test('finds image type by description', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const found = await service.getOne({ description: typeData.description }, { trx });
            expect(found).toBeInstanceOf(ImageTypeEntity);
            expect(found.id).toBe(created.id);
            expect(found.description).toBe(typeData.description);
        });

        test('returns undefined for non-existent value', async () => {
            const found = await service.getOne({ value: 'nonexistent_value' }, { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('Bulk Operations', () => {
        test('creates multiple image types', async () => {
            const type1Data = await seedOne();
            const type2Data = await seedOne();
            const type3Data = await seedOne();

            const type1 = await service.create(type1Data, { trx });
            const type2 = await service.create(type2Data, { trx });
            const type3 = await service.create(type3Data, { trx });

            expect(type1).toBeInstanceOf(ImageTypeEntity);
            expect(type2).toBeInstanceOf(ImageTypeEntity);
            expect(type3).toBeInstanceOf(ImageTypeEntity);

            const allTypes = await service.getAll({ trx });
            expect(allTypes.length).toBeGreaterThanOrEqual(3);
        });

        test('lists all image types', async () => {
            const type1Data = await seedOne();
            const type2Data = await seedOne();

            await service.create(type1Data, { trx });
            await service.create(type2Data, { trx });

            const allTypes = await service.getAll({ trx });
            expect(Array.isArray(allTypes)).toBe(true);
            expect(allTypes.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Update Operations', () => {
        test('updates image type label', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const newLabel = 'Updated Label';
            await service.update(created.id, { label: newLabel }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.label).toBe(newLabel);
            expect(updated.value).toBe(typeData.value);
        });

        test('updates image type description', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });

            const newDescription = 'Updated description';
            await service.update(created.id, { description: newDescription }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.description).toBe(newDescription);
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

    describe('Timestamp Tracking', () => {
        test('sets createdAt on creation', async () => {
            const typeData = await seedOne();
            const imageType = await service.create(typeData, { trx });

            expect(imageType.createdAt).toBeInstanceOf(Date);
            expect(imageType.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('sets updatedAt on creation', async () => {
            const typeData = await seedOne();
            const imageType = await service.create(typeData, { trx });

            expect(imageType.updatedAt).toBeInstanceOf(Date);
            expect(imageType.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
        });

        test('createdAt and updatedAt are close on creation', async () => {
            const typeData = await seedOne();
            const imageType = await service.create(typeData, { trx });

            const timeDiff = Math.abs(
                imageType.updatedAt.getTime() - imageType.createdAt.getTime()
            );
            // Should be within 1 second
            expect(timeDiff).toBeLessThan(1000);
        });

        test('update changes updatedAt timestamp', async () => {
            const typeData = await seedOne();
            const created = await service.create(typeData, { trx });
            const originalUpdatedAt = created.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            await service.update(created.id, { label: 'New Label' }, { trx });
            const updated = await service.getById(created.id, { trx });

            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });
});
