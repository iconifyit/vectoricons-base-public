/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const EntityToTagsService = require('../EntityToTagsService');

describe('EntityToTagsService - Custom Methods', () => {
    let service;
    let trx;
    let actualTag = null;
    let testIcons = [];

    beforeAll(async () => {
        service = new EntityToTagsService();

        // Fetch first available tag for tests
        const tag = await DB.tags.query().where({ is_active: true }).first();
        if (tag) {
            actualTag = {
                id: tag.id,
                name: tag.name,
            };
        }

        // Get multiple icons for test data
        const icons = await DB.icons.query().where({ is_active: true }).limit(20);
        testIcons = icons.map(i => i.id);

        if (!actualTag) {
            throw new Error('No active tags found in database for testing');
        }
        if (testIcons.length === 0) {
            throw new Error('No active icons found in database for testing');
        }
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
        }
    });

    describe('getTagsForEntity', () => {
        it('should get all tags for a specific entity', async () => {
            const entityType = 'icon';
            const entityId = 20000;

            await service.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            const results = await service.getTagsForEntity(entityType, entityId, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results[0].entityType).toBe(entityType);
            expect(results[0].entityId).toBe(entityId);
        });

        it('should return empty array for entity with no tags', async () => {
            const results = await service.getTagsForEntity('icon', 99999, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(0);
        });
    });

    describe('getEntitiesWithTag', () => {
        it('should get all entities with a specific tag', async () => {
            await service.linkEntityToTag('icon', 21000, actualTag.id, { trx });

            const results = await service.getEntitiesWithTag(actualTag.id, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.every(r => r.tagId === actualTag.id)).toBe(true);
        });

        it('should return empty array for tag with no entities', async () => {
            const results = await service.getEntitiesWithTag(99999, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(0);
        });
    });

    describe('getEntitiesByType', () => {
        it.skip('should get all mappings for a specific entity type', async () => {
            const entityType = 'icon';

            await service.linkEntityToTag(entityType, 23000, actualTag.id, { trx });

            const results = await service.getEntitiesByType(entityType, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.every(r => r.entityType === entityType)).toBe(true);
        });
    });

    describe('linkEntityToTag', () => {
        it('should link entity to tag', async () => {
            const entityType = 'icon';
            const entityId = 25000;

            const result = await service.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            expect(result).toBeDefined();
            expect(result.entityType).toBe(entityType);
            expect(result.entityId).toBe(entityId);
            expect(result.tagId).toBe(actualTag.id);
        });
    });

    describe('unlinkEntityFromTag', () => {
        it('should unlink entity from tag', async () => {
            const entityType = 'icon';
            const entityId = 26000;

            await service.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            const deleteCount = await service.unlinkEntityFromTag(entityType, entityId, actualTag.id, { trx });

            expect(deleteCount).toBeGreaterThanOrEqual(1);

            const results = await service.getTagsForEntity(entityType, entityId, { trx });
            expect(results.length).toBe(0);
        });
    });

    describe('linkEntityToTags', () => {
        it('should link entity to multiple tags', async () => {
            const entityType = 'icon';
            const entityId = 27000;

            const results = await service.linkEntityToTags(entityType, entityId, [actualTag.id], { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(1);
            expect(results[0].entityType).toBe(entityType);
            expect(results[0].entityId).toBe(entityId);
        });
    });

    describe('unlinkEntityFromAllTags', () => {
        it('should unlink entity from all tags', async () => {
            const entityType = 'icon';
            const entityId = 28000;

            await service.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            const deleteCount = await service.unlinkEntityFromAllTags(entityType, entityId, { trx });

            expect(deleteCount).toBeGreaterThanOrEqual(1);

            const results = await service.getTagsForEntity(entityType, entityId, { trx });
            expect(results.length).toBe(0);
        });

        it('should return 0 when unlinking entity with no tags', async () => {
            const deleteCount = await service.unlinkEntityFromAllTags('icon', 99999, { trx });

            expect(deleteCount).toBe(0);
        });
    });
});
