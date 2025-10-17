/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const StyleService = require('../StyleService');
const StyleEntity = require('../StyleEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        value: `style_value_${testCounter}`,
        label: `Style Label ${testCounter}`,
    };
};

const initService = () => {
    return new StyleService();
};

// Contract tests
serviceContract({
    name: 'Style',
    initService: initService,
    Entity: StyleEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ value: data.value }),
    supportsSoftDelete: false,
    supportsActivation: false,
    supportsTimestamps: false,
});

// Custom tests
describe('StyleService - Custom Tests', () => {
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
        test('creates style with unique value', async () => {
            const styleData = await seedOne();
            const style = await service.create(styleData, { trx });

            expect(style).toBeInstanceOf(StyleEntity);
            expect(style.value).toBe(styleData.value);
            expect(style.label).toBe(styleData.label);
        });

        test('prevents duplicate value creation', async () => {
            const styleData = await seedOne();
            await service.create(styleData, { trx });

            // Attempt to create another style with same value
            const duplicateData = {
                value: styleData.value,
                label: 'Different Label',
            };

            await expect(
                service.create(duplicateData, { trx })
            ).rejects.toThrow();
        });

        test('allows same label with different value', async () => {
            const style1Data = await seedOne();
            const style1 = await service.create(style1Data, { trx });

            const style2Data = {
                value: `different_value_${testCounter}`,
                label: style1Data.label, // Same label
            };
            const style2 = await service.create(style2Data, { trx });

            expect(style2).toBeInstanceOf(StyleEntity);
            expect(style2.label).toBe(style1.label);
            expect(style2.value).not.toBe(style1.value);
        });
    });

    describe('Lookup Operations', () => {
        test('finds style by value', async () => {
            const styleData = await seedOne();
            const created = await service.create(styleData, { trx });

            const found = await service.getOne({ value: styleData.value }, { trx });
            expect(found).toBeInstanceOf(StyleEntity);
            expect(found.id).toBe(created.id);
            expect(found.value).toBe(styleData.value);
        });

        test('finds style by label', async () => {
            const styleData = await seedOne();
            const created = await service.create(styleData, { trx });

            const found = await service.getOne({ label: styleData.label }, { trx });
            expect(found).toBeInstanceOf(StyleEntity);
            expect(found.id).toBe(created.id);
            expect(found.label).toBe(styleData.label);
        });

        test('returns undefined for non-existent value', async () => {
            const found = await service.getOne({ value: 'nonexistent_value' }, { trx });
            expect(found).toBeUndefined();
        });
    });

    describe('Bulk Operations', () => {
        test('creates multiple styles', async () => {
            const style1Data = await seedOne();
            const style2Data = await seedOne();
            const style3Data = await seedOne();

            const style1 = await service.create(style1Data, { trx });
            const style2 = await service.create(style2Data, { trx });
            const style3 = await service.create(style3Data, { trx });

            expect(style1).toBeInstanceOf(StyleEntity);
            expect(style2).toBeInstanceOf(StyleEntity);
            expect(style3).toBeInstanceOf(StyleEntity);

            const allStyles = await service.getAll({ trx });
            expect(allStyles.length).toBeGreaterThanOrEqual(3);
        });

        test('filters styles by partial label match', async () => {
            const prefix = `TestPrefix${testCounter}`;
            const style1Data = {
                value: `value1_${testCounter++}`,
                label: `${prefix} Style One`,
            };
            const style2Data = {
                value: `value2_${testCounter++}`,
                label: `${prefix} Style Two`,
            };
            const style3Data = {
                value: `value3_${testCounter++}`,
                label: 'Different Style',
            };

            await service.create(style1Data, { trx });
            await service.create(style2Data, { trx });
            await service.create(style3Data, { trx });

            // Get all and filter in JS since getWhere doesn't support LIKE
            const allStyles = await service.getAll({ trx });
            const filtered = allStyles.filter(s => s.label.includes(prefix));
            expect(filtered.length).toBe(2);
        });
    });

    describe('Update Operations', () => {
        test('updates style label', async () => {
            const styleData = await seedOne();
            const created = await service.create(styleData, { trx });

            const newLabel = 'Updated Label';
            await service.update(created.id, { label: newLabel }, { trx });

            const updated = await service.getById(created.id, { trx });
            expect(updated.label).toBe(newLabel);
            expect(updated.value).toBe(styleData.value);
        });

        test('prevents updating to duplicate value', async () => {
            const style1Data = await seedOne();
            const style2Data = await seedOne();

            const style1 = await service.create(style1Data, { trx });
            const style2 = await service.create(style2Data, { trx });

            // Attempt to update style2 to have style1's value
            await expect(
                service.update(style2.id, { value: style1.value }, { trx })
            ).rejects.toThrow();
        });
    });
});
