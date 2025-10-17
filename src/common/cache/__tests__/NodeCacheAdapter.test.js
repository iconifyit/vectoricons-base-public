const NodeCacheAdapter = require('../adapters/NodeCacheAdapter');

describe('NodeCacheAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new NodeCacheAdapter({ stdTTL: 60, checkperiod: 120 });
    });

    afterEach(async () => {
        await adapter.close();
    });

    describe('constructor', () => {
        it('should create adapter with default options', () => {
            const defaultAdapter = new NodeCacheAdapter();
            expect(defaultAdapter).toBeInstanceOf(NodeCacheAdapter);
            expect(defaultAdapter.cache).toBeDefined();
        });

        it('should create adapter with custom TTL', () => {
            const customAdapter = new NodeCacheAdapter({ stdTTL: 300 });
            expect(customAdapter.cache).toBeDefined();
        });
    });

    describe('set and get', () => {
        it('should set and get a simple value', async () => {
            await adapter.set('testKey', 'testValue');
            const result = await adapter.get('testKey');
            expect(result).toBe('testValue');
        });

        it('should set and get an object', async () => {
            const obj = { foo: 'bar', nested: { value: 123 } };
            await adapter.set('objKey', obj);
            const result = await adapter.get('objKey');
            expect(result).toEqual(obj);
        });

        it('should set and get an array', async () => {
            const arr = [1, 2, 3, 'test'];
            await adapter.set('arrKey', arr);
            const result = await adapter.get('arrKey');
            expect(result).toEqual(arr);
        });

        it('should return null for non-existent key', async () => {
            const result = await adapter.get('nonExistentKey');
            expect(result).toBeNull();
        });

        it('should respect custom TTL', async () => {
            await adapter.set('shortLivedKey', 'value', 1);
            const immediate = await adapter.get('shortLivedKey');
            expect(immediate).toBe('value');

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            const afterExpiry = await adapter.get('shortLivedKey');
            expect(afterExpiry).toBeNull();
        });

        it('should store value without TTL when ttlSeconds is undefined', async () => {
            await adapter.set('noTTL', 'persistent', undefined);
            const result = await adapter.get('noTTL');
            expect(result).toBe('persistent');
        });
    });

    describe('del', () => {
        it('should delete an existing key', async () => {
            await adapter.set('deleteMe', 'value');
            expect(await adapter.get('deleteMe')).toBe('value');

            await adapter.del('deleteMe');
            expect(await adapter.get('deleteMe')).toBeNull();
        });

        it('should return true even for non-existent keys', async () => {
            const result = await adapter.del('nonExistent');
            expect(result).toBe(true);
        });
    });

    describe('invalidatePrefix', () => {
        it('should delete all keys with given prefix', async () => {
            await adapter.set('user:1', 'data1');
            await adapter.set('user:2', 'data2');
            await adapter.set('post:1', 'post1');

            await adapter.invalidatePrefix('user:');

            expect(await adapter.get('user:1')).toBeNull();
            expect(await adapter.get('user:2')).toBeNull();
            expect(await adapter.get('post:1')).toBe('post1');
        });

        it('should handle empty prefix gracefully', async () => {
            await adapter.set('key1', 'val1');
            await adapter.invalidatePrefix('nonExistentPrefix:');
            expect(await adapter.get('key1')).toBe('val1');
        });
    });

    describe('entity rehydration', () => {
        class MockEntity {
            constructor(data) {
                this.id = data.id;
                this.name = data.name;
            }
        }

        const mockRepository = {
            wrapEntity: jest.fn((data, EntityClass) => new EntityClass(data)),
        };

        beforeEach(() => {
            mockRepository.wrapEntity.mockClear();
        });

        it('should return plain value without context', async () => {
            const plainData = { id: 1, name: 'test' };
            await adapter.set('plain', plainData);
            const result = await adapter.get('plain');
            expect(result).toEqual(plainData);
            expect(mockRepository.wrapEntity).not.toHaveBeenCalled();
        });

        it('should rehydrate entity with context', async () => {
            const plainData = { id: 1, name: 'test' };
            await adapter.set('entity', plainData);

            const result = await adapter.get('entity', {
                repository: mockRepository,
                entityClass: MockEntity,
            });

            expect(result).toBeInstanceOf(MockEntity);
            expect(result.id).toBe(1);
            expect(result.name).toBe('test');
            expect(mockRepository.wrapEntity).toHaveBeenCalledWith(plainData, MockEntity);
        });

        it('should rehydrate array of entities', async () => {
            const plainArray = [
                { id: 1, name: 'first' },
                { id: 2, name: 'second' },
            ];
            await adapter.set('entities', plainArray);

            const result = await adapter.get('entities', {
                repository: mockRepository,
                entityClass: MockEntity,
            });

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(MockEntity);
            expect(result[1]).toBeInstanceOf(MockEntity);
            expect(mockRepository.wrapEntity).toHaveBeenCalledTimes(2);
        });

        it('should return already instantiated entity without re-wrapping', async () => {
            const entity = new MockEntity({ id: 1, name: 'test' });
            await adapter.set('existingEntity', entity);

            const result = await adapter.get('existingEntity', {
                repository: mockRepository,
                entityClass: MockEntity,
            });

            expect(result).toBeInstanceOf(MockEntity);
            expect(mockRepository.wrapEntity).not.toHaveBeenCalled();
        });

        it('should return empty array without wrapping', async () => {
            await adapter.set('emptyArray', []);

            const result = await adapter.get('emptyArray', {
                repository: mockRepository,
                entityClass: MockEntity,
            });

            expect(result).toEqual([]);
            expect(mockRepository.wrapEntity).not.toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should close the cache successfully', async () => {
            const result = await adapter.close();
            expect(result).toBe(true);
        });
    });
});
