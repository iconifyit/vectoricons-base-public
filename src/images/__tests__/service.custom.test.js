/* eslint-env jest */

jest.setTimeout(10000);

const DB = require('@vectoricons.net/db');
const { initImageService } = require('../index');
const { seedOne } = require('./seed');

describe('Image Service Custom Tests', () => {
    let service;
    let trx;

    beforeAll(async () => {
        trx = await DB.knex.transaction();
        service = initImageService();
    });

    afterAll(async () => {
        try { await trx.rollback(); } catch {}
    });

    test('getActive() with WHERE clause returns filtered active images', async () => {
        // Create test images
        const data1 = await seedOne({ trx });
        const data2 = await seedOne({ trx });
        const data3 = await seedOne({ trx });

        const created1 = await service.create(data1, { trx });
        const created2 = await service.create(data2, { trx });
        const created3 = await service.create(data3, { trx });

        // Deactivate one of them
        await service.deactivate(created2.id, { trx });

        // Get active images with WHERE clause to limit result set
        const where = {
            entity_type: data1.entity_type,
            entity_id: data1.entity_id,
        };

        const activeImages = await service.getActive(where, { trx });

        expect(Array.isArray(activeImages)).toBe(true);
        expect(activeImages.length).toBeGreaterThanOrEqual(2);

        // All returned images should be active
        activeImages.forEach(img => {
            expect(img.isActive).toBe(true);
            expect(img.isDeleted).toBe(false);
        });

        // Should include created1 and created3, but not created2
        const ids = activeImages.map(img => img.id);
        expect(ids).toContain(created1.id);
        expect(ids).toContain(created3.id);
        expect(ids).not.toContain(created2.id);
    });

    test('activate() sets is_active to true', async () => {
        const data = await seedOne({ trx });
        const created = await service.create(data, { trx });

        // Manually set to inactive
        await service.repository.update(created.id, {
            is_active: false
        }, { trx });

        // Activate it
        const result = await service.activate(created.id, { trx });
        expect(result).toBeGreaterThanOrEqual(1);

        // Verify
        const fetched = await service.getById(created.id, { trx });
        expect(fetched.isActive).toBe(true);
    });

    test('deactivate() sets is_active to false', async () => {
        const data = await seedOne({ trx });
        const created = await service.create(data, { trx });

        // Deactivate it
        const result = await service.deactivate(created.id, { trx });
        expect(result).toBeGreaterThanOrEqual(1);

        // Verify
        const fetched = await service.getById(created.id, { trx });
        expect(fetched.isActive).toBe(false);
        expect(fetched.isDeleted).toBe(false);
    });

    test('toggleActive() method exists and returns a number', async () => {
        const data = await seedOne({ trx });
        const created = await service.create(data, { trx });

        // toggleActive should work and return affected count
        const result = await service.toggleActive(created.id, { trx });
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(1);
    });
});
