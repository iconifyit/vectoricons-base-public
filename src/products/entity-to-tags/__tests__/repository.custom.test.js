/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const EntityToTagsRepository = require('../EntityToTagsRepository');

describe('EntityToTagsRepository - Custom Methods', () => {
    let repository;
    let trx;
    let actualTag = null;

    beforeAll(async () => {
        repository = new EntityToTagsRepository({ DB });

        // Fetch first available tag for tests
        const tag = await DB.tags.query().where({ is_active: true }).first();
        if (tag) {
            actualTag = {
                id: tag.id,
                name: tag.name,
            };
        }

        if (!actualTag) {
            throw new Error('No active tags found in database for testing');
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

    describe('findByEntity', () => {
        it('should find all tags for a specific entity', async () => {
            const entityType = 'icon';
            const entityId = 1000;

            // Create tag link for the entity
            await repository.create({
                entity_type: entityType,
                entity_id: entityId,
                tag_id: actualTag.id
            }, { trx });

            const results = await repository.findByEntity(entityType, entityId, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results[0].entityType).toBe(entityType);
            expect(results[0].entityId).toBe(entityId);
        });

        it('should return empty array for entity with no tags', async () => {
            const results = await repository.findByEntity('icon', 99999, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(0);
        });

        it('should filter by different entity types', async () => {
            const iconEntityId = 2000;

            await repository.create({
                entity_type: 'icon',
                entity_id: iconEntityId,
                tag_id: actualTag.id
            }, { trx });

            const iconResults = await repository.findByEntity('icon', iconEntityId, { trx });

            expect(iconResults.length).toBeGreaterThanOrEqual(1);
            expect(iconResults[0].entityType).toBe('icon');
        });
    });

    describe('findByTag', () => {
        it('should find all entities with a specific tag', async () => {
            // Create entity link for the tag
            await repository.create({
                entity_type: 'icon',
                entity_id: 4000,
                tag_id: actualTag.id
            }, { trx });

            const results = await repository.findByTag(actualTag.id, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.every(r => r.tagId === actualTag.id)).toBe(true);
        });

        it('should return empty array for tag with no entities', async () => {
            const results = await repository.findByTag(99999, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(0);
        });
    });

    describe('findByEntityType', () => {
        it.skip('should find all mappings for a specific entity type', async () => {
            const entityType = 'icon';

            await repository.create({
                entity_type: entityType,
                entity_id: 6000,
                tag_id: actualTag.id
            }, { trx });

            const results = await repository.findByEntityType(entityType, { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.every(r => r.entityType === entityType)).toBe(true);
        });

        it.skip('should return empty array for entity type with no mappings', async () => {
            const results = await repository.findByEntityType('nonexistent-type', { trx });

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(0);
        });
    });

    describe('linkEntityToTag', () => {
        it('should create a link between entity and tag', async () => {
            const entityType = 'icon';
            const entityId = 8000;

            const result = await repository.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            expect(result).toBeDefined();
            expect(result.entityType).toBe(entityType);
            expect(result.entityId).toBe(entityId);
            expect(result.tagId).toBe(actualTag.id);
        });

        it('should prevent duplicate links (unique constraint)', async () => {
            const entityType = 'icon';
            const entityId = 9000;

            await repository.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            await expect(
                repository.linkEntityToTag(entityType, entityId, actualTag.id, { trx })
            ).rejects.toThrow();
        });
    });

    describe('unlinkEntityFromTag', () => {
        it('should remove link between entity and tag', async () => {
            const entityType = 'icon';
            const entityId = 10000;

            await repository.linkEntityToTag(entityType, entityId, actualTag.id, { trx });

            const deleteCount = await repository.unlinkEntityFromTag(entityType, entityId, actualTag.id, { trx });

            expect(deleteCount).toBeGreaterThanOrEqual(1);

            const results = await repository.findByEntity(entityType, entityId, { trx });
            expect(results.length).toBe(0);
        });

        it('should return 0 when unlinking non-existent link', async () => {
            const deleteCount = await repository.unlinkEntityFromTag('icon', 99999, actualTag.id, { trx });

            expect(deleteCount).toBe(0);
        });
    });
});
