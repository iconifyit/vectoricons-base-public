/* eslint-env jest */

const DownloadRepository = require('../DownloadRepository');
const DownloadEntity = require('../DownloadEntity');

describe('DownloadRepository - Unit Tests', () => {
    let repository;

    beforeEach(() => {
        // Create repository instance (uses real DB connection from @vectoricons.net/db)
        repository = new DownloadRepository({});
    });

    describe('Constructor', () => {
        test('initializes with correct model name', () => {
            expect(repository.modelName).toBe('downloads');
        });

        test('initializes with correct entity class', () => {
            expect(repository.entityClass).toBe(DownloadEntity);
        });

        test('initializes with DB instance', () => {
            expect(repository.DB).toBeDefined();
            expect(repository.DB.downloads).toBeDefined();
        });

        test('initializes with correct model', () => {
            expect(repository.model).toBeDefined();
            expect(repository.model).toBe(repository.DB.downloads);
        });
    });

    describe('Entity Wrapping', () => {
        test('wrapEntity converts raw record to DownloadEntity', () => {
            const rawRecord = {
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

            const entity = repository.wrapEntity(rawRecord, DownloadEntity);

            expect(entity).toBeInstanceOf(DownloadEntity);
            expect(entity.id).toBe(1);
            expect(entity.userId).toBe(100);
            expect(entity.entityId).toBe(200);
            expect(entity.entityType).toBe('set');
        });

        test('wrapEntity returns null for null input', () => {
            const entity = repository.wrapEntity(null, DownloadEntity);
            expect(entity).toBeNull();
        });

        test('wrapEntity converts array of raw records', () => {
            const rawRecords = [
                {
                    id: 1,
                    user_id: 100,
                    entity_unique_id: 'test1',
                    entity_id: 1,
                },
                {
                    id: 2,
                    user_id: 200,
                    entity_unique_id: 'test2',
                    entity_id: 2,
                },
            ];

            const entities = repository.wrapEntity(rawRecords, DownloadEntity);

            expect(Array.isArray(entities)).toBe(true);
            expect(entities.length).toBe(2);
            expect(entities[0]).toBeInstanceOf(DownloadEntity);
            expect(entities[1]).toBeInstanceOf(DownloadEntity);
            expect(entities[0].id).toBe(1);
            expect(entities[1].id).toBe(2);
        });

        test('wrapEntity returns empty array for empty input', () => {
            const entities = repository.wrapEntity([], DownloadEntity);
            expect(Array.isArray(entities)).toBe(true);
            expect(entities.length).toBe(0);
        });
    });

    describe('Query Builder Access', () => {
        test('query() returns query builder', () => {
            const queryBuilder = repository.query();
            expect(queryBuilder).toBeDefined();
            expect(typeof queryBuilder.where).toBe('function');
            expect(typeof queryBuilder.findById).toBe('function');
        });

        test('query() accepts transaction', () => {
            const mockTrx = { commit: jest.fn() };
            const queryBuilder = repository.query({ trx: mockTrx });
            expect(queryBuilder).toBeDefined();
        });
    });

    describe('Inheritance', () => {
        test('extends BaseRepository with all CRUD methods', () => {
            // Check that it has BaseRepository methods
            expect(typeof repository.findById).toBe('function');
            expect(typeof repository.findAll).toBe('function');
            expect(typeof repository.findOne).toBe('function');
            expect(typeof repository.findByIds).toBe('function');
            expect(typeof repository.create).toBe('function');
            expect(typeof repository.createMany).toBe('function');
            expect(typeof repository.update).toBe('function');
            expect(typeof repository.updateWhere).toBe('function');
            expect(typeof repository.delete).toBe('function');
            expect(typeof repository.deleteWhere).toBe('function');
            expect(typeof repository.upsert).toBe('function');
            expect(typeof repository.exists).toBe('function');
            expect(typeof repository.count).toBe('function');
            expect(typeof repository.paginate).toBe('function');
            expect(typeof repository.withRelations).toBe('function');
            expect(typeof repository.raw).toBe('function');
        });

        test('has no custom methods beyond BaseRepository', () => {
            // Get all methods from the prototype
            const proto = Object.getPrototypeOf(repository);
            const protoMethods = Object.getOwnPropertyNames(proto)
                .filter(name => typeof repository[name] === 'function' && name !== 'constructor');

            // Get all methods from BaseRepository
            const BaseRepository = Object.getPrototypeOf(proto).constructor;
            const baseProto = BaseRepository.prototype;
            const baseMethods = Object.getOwnPropertyNames(baseProto)
                .filter(name => typeof baseProto[name] === 'function' && name !== 'constructor');

            // Check that DownloadRepository has no additional methods
            const customMethods = protoMethods.filter(method => !baseMethods.includes(method));

            expect(customMethods).toEqual([]);
        });
    });
});
