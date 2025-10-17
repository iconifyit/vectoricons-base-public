/* eslint-env jest */

const DownloadEntity = require('../DownloadEntity');

describe('DownloadEntity - Unit Tests', () => {
    describe('Constructor', () => {
        test('creates entity with all provided fields', () => {
            const data = {
                id: 1,
                userId: 100,
                entityId: 200,
                entityType: 'set',
                entityUniqueId: 'test123',
                uniqueId: 'unique123',
                objectKey: 'path/to/file.zip',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            const entity = new DownloadEntity(data);

            expect(entity.id).toBe(1);
            expect(entity.userId).toBe(100);
            expect(entity.entityId).toBe(200);
            expect(entity.entityType).toBe('set');
            expect(entity.entityUniqueId).toBe('test123');
            expect(entity.uniqueId).toBe('unique123');
            expect(entity.objectKey).toBe('path/to/file.zip');
            expect(entity.createdAt).toEqual(new Date('2024-01-01'));
            expect(entity.updatedAt).toEqual(new Date('2024-01-02'));
        });

        test('creates entity with minimal fields', () => {
            const data = {
                entityId: 1,
                entityUniqueId: 'test123',
            };

            const entity = new DownloadEntity(data);

            expect(entity.entityId).toBe(1);
            expect(entity.entityUniqueId).toBe('test123');
            expect(entity.id).toBeUndefined();
            expect(entity.userId).toBeUndefined();
        });

        test('ignores unknown fields', () => {
            const data = {
                id: 1,
                unknownField: 'should be ignored',
                anotherUnknown: 123,
            };

            const entity = new DownloadEntity(data);

            expect(entity.id).toBe(1);
            expect(entity).not.toHaveProperty('unknownField');
            expect(entity).not.toHaveProperty('anotherUnknown');
        });

        test('converts snake_case fields to camelCase', () => {
            const data = {
                id: 1,
                user_id: 100,
                entity_id: 200,
                entity_type: 'set',
                entity_unique_id: 'test123',
                unique_id: 'unique123',
                object_key: 'path/to/file.zip',
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
            };

            const entity = new DownloadEntity(data);

            expect(entity.userId).toBe(100);
            expect(entity.entityId).toBe(200);
            expect(entity.entityType).toBe('set');
            expect(entity.entityUniqueId).toBe('test123');
            expect(entity.uniqueId).toBe('unique123');
            expect(entity.objectKey).toBe('path/to/file.zip');
            expect(entity.createdAt).toEqual(new Date('2024-01-01'));
            expect(entity.updatedAt).toEqual(new Date('2024-01-02'));
        });
    });

    describe('toJSON', () => {
        test('serializes all fields to camelCase', () => {
            const data = {
                id: 1,
                userId: 100,
                entityId: 200,
                entityType: 'set',
                entityUniqueId: 'test123',
                uniqueId: 'unique123',
                objectKey: 'path/to/file.zip',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            const entity = new DownloadEntity(data);
            const json = entity.toJSON();

            expect(json).toEqual({
                id: 1,
                userId: 100,
                entityId: 200,
                entityType: 'set',
                entityUniqueId: 'test123',
                uniqueId: 'unique123',
                objectKey: 'path/to/file.zip',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
            });
        });

        test('converts Dates to ISO strings', () => {
            const data = {
                id: 1,
                createdAt: new Date('2024-01-01T10:30:00Z'),
                updatedAt: new Date('2024-01-02T15:45:00Z'),
            };

            const entity = new DownloadEntity(data);
            const json = entity.toJSON();

            expect(typeof json.createdAt).toBe('string');
            expect(typeof json.updatedAt).toBe('string');
            expect(json.createdAt).toBe('2024-01-01T10:30:00.000Z');
            expect(json.updatedAt).toBe('2024-01-02T15:45:00.000Z');
        });

        test('excludes undefined fields', () => {
            const data = {
                id: 1,
                entityUniqueId: 'test123',
            };

            const entity = new DownloadEntity(data);
            const json = entity.toJSON();

            expect(json).toHaveProperty('id');
            expect(json).toHaveProperty('entityUniqueId');
            expect(json).not.toHaveProperty('userId');
            expect(json).not.toHaveProperty('objectKey');
        });
    });

    describe('Field Access', () => {
        test('allows reading all allowed fields', () => {
            const data = {
                id: 1,
                userId: 100,
                entityId: 200,
                entityType: 'set',
                entityUniqueId: 'test123',
                uniqueId: 'unique123',
                objectKey: 'path/to/file.zip',
            };

            const entity = new DownloadEntity(data);

            expect(() => entity.id).not.toThrow();
            expect(() => entity.userId).not.toThrow();
            expect(() => entity.entityId).not.toThrow();
            expect(() => entity.entityType).not.toThrow();
            expect(() => entity.entityUniqueId).not.toThrow();
            expect(() => entity.uniqueId).not.toThrow();
            expect(() => entity.objectKey).not.toThrow();
        });

        test('entity type can be one of allowed values', () => {
            const validTypes = ['icon', 'illustration', 'family', 'set', 'credit', 'subscription', 'user'];

            validTypes.forEach(type => {
                const entity = new DownloadEntity({
                    id: 1,
                    entityType: type,
                });
                expect(entity.entityType).toBe(type);
            });
        });
    });

    describe('Relations', () => {
        test('can have user relation', () => {
            const data = {
                id: 1,
                userId: 100,
                user: {
                    id: 100,
                    email: 'test@example.com',
                },
            };

            const entity = new DownloadEntity(data);

            expect(entity.user).toBeDefined();
            expect(entity.user.id).toBe(100);
            expect(entity.user.email).toBe('test@example.com');
        });

        test('toJSON includes materialized relations', () => {
            const data = {
                id: 1,
                userId: 100,
                user: {
                    id: 100,
                    email: 'test@example.com',
                    username: 'testuser',
                },
            };

            const entity = new DownloadEntity(data);
            const json = entity.toJSON();

            expect(json.user).toBeDefined();
            expect(json.user.id).toBe(100);
            expect(json.user.email).toBe('test@example.com');
        });
    });
});
