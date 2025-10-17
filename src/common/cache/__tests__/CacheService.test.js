jest.mock('../../../utils', () => ({
    getRequestVars: jest.fn(() => ({})),
}));

const CacheService = require('../CacheService');
const { CacheModes } = require('../CacheConstants');

describe('CacheService', () => {
    let mockAdapter;
    let cacheService;

    beforeEach(() => {
        mockAdapter = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
        };
        cacheService = new CacheService(mockAdapter);
    });

    describe('constructor', () => {
        it('should throw error if no adapter provided', () => {
            expect(() => new CacheService()).toThrow('A valid cache adapter is required');
        });

        it('should throw error if adapter missing get method', () => {
            const invalidAdapter = { set: jest.fn() };
            expect(() => new CacheService(invalidAdapter)).toThrow('A valid cache adapter is required');
        });

        it('should create service with valid adapter', () => {
            expect(cacheService).toBeInstanceOf(CacheService);
            expect(cacheService.adapter).toBe(mockAdapter);
        });
    });

    describe('getCacheKey', () => {
        it('should generate key with baseKey only', () => {
            const key = cacheService.getCacheKey('users');
            expect(key).toMatch(/^users:[a-f0-9]{32}$/);
        });

        it('should generate consistent key for same params', () => {
            const params = { page: 1, limit: 10 };
            const key1 = cacheService.getCacheKey('users', params);
            const key2 = cacheService.getCacheKey('users', params);
            expect(key1).toBe(key2);
        });

        it('should generate different keys for different params', () => {
            const key1 = cacheService.getCacheKey('users', { page: 1 });
            const key2 = cacheService.getCacheKey('users', { page: 2 });
            expect(key1).not.toBe(key2);
        });

        it('should sort params for consistent keys', () => {
            const key1 = cacheService.getCacheKey('users', { z: 1, a: 2 });
            const key2 = cacheService.getCacheKey('users', { a: 2, z: 1 });
            expect(key1).toBe(key2);
        });

        it('should include userId in key when provided', () => {
            const key1 = cacheService.getCacheKey('profile', {}, 123);
            const key2 = cacheService.getCacheKey('profile', {}, 456);
            expect(key1).not.toBe(key2);
        });

        it('should handle object params', () => {
            const params = { filter: { status: 'active' } };
            const key = cacheService.getCacheKey('users', params);
            expect(key).toMatch(/^users:[a-f0-9]{32}$/);
        });

        it('should generate different keys for different object structures', () => {
            const key1 = cacheService.getCacheKey('users', { filter: { a: 1 } });
            const key2 = cacheService.getCacheKey('users', { filter: { b: 1 } });
            expect(key1).not.toBe(key2);
        });
    });

    describe('clearCache', () => {
        beforeEach(() => {
            mockAdapter.keys.mockResolvedValue([
                'users:hash1',
                'users:hash2',
                'posts:hash3',
                'comments:hash4',
            ]);
        });

        it('should clear all keys by baseKey', async () => {
            const count = await cacheService.clearCache({ baseKey: 'users' });

            expect(mockAdapter.keys).toHaveBeenCalled();
            expect(mockAdapter.del).toHaveBeenCalledWith(['users:hash1', 'users:hash2']);
            expect(count).toBe(2);
        });

        it('should clear keys using custom matcher function', async () => {
            const matcher = (key) => key.includes('hash3') || key.includes('hash4');
            const count = await cacheService.clearCache({ matcher });

            expect(mockAdapter.del).toHaveBeenCalledWith(['posts:hash3', 'comments:hash4']);
            expect(count).toBe(2);
        });

        it('should clear all keys when no options provided', async () => {
            const count = await cacheService.clearCache();

            expect(mockAdapter.del).toHaveBeenCalledWith([
                'users:hash1',
                'users:hash2',
                'posts:hash3',
                'comments:hash4',
            ]);
            expect(count).toBe(4);
        });

        it('should return 0 when no keys match', async () => {
            const count = await cacheService.clearCache({ baseKey: 'nonexistent' });
            expect(count).toBe(0);
        });
    });

    describe('cacheHandler', () => {
        let mockReq;
        let mockRes;
        let mockNext;
        let mockHandler;

        beforeEach(() => {
            mockReq = {
                query: {},
                params: {},
                body: {},
                user: null,
            };
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            mockNext = jest.fn();
            mockHandler = jest.fn().mockResolvedValue({ data: 'test' });
        });

        it('should return cached data when available (DEFAULT mode)', async () => {
            const cachedData = { data: 'cached' };
            mockAdapter.get.mockResolvedValue(cachedData);

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.get).toHaveBeenCalled();
            expect(mockHandler).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                data: 'cached',
                fromCache: true,
            });
        });

        it('should fetch and cache data when not cached (DEFAULT mode)', async () => {
            mockAdapter.get.mockResolvedValue(null);
            const freshData = { result: 'fresh' };
            mockHandler.mockResolvedValue(freshData);

            const middleware = cacheService.cacheHandler('test', mockHandler, 3600);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.get).toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalledWith(mockReq);
            expect(mockAdapter.set).toHaveBeenCalledWith(
                expect.any(String),
                freshData,
                3600
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                result: 'fresh',
                fromCache: false,
            });
        });

        it('should skip cache when mode is SKIP', async () => {
            mockReq.query.cacheMode = CacheModes.SKIP;
            const freshData = { result: 'fresh' };
            mockHandler.mockResolvedValue(freshData);

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.get).not.toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalled();
            expect(mockAdapter.set).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                result: 'fresh',
                fromCache: false,
            });
        });

        it('should bust cache and fetch fresh data when mode is BUST', async () => {
            mockReq.query.cacheMode = CacheModes.BUST;
            const freshData = { result: 'fresh' };
            mockHandler.mockResolvedValue(freshData);

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.del).toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalled();
            expect(mockAdapter.set).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                result: 'fresh',
                fromCache: false,
            });
        });

        it('should refresh cache when mode is REFRESH', async () => {
            mockReq.query.cacheMode = CacheModes.REFRESH;
            const freshData = { result: 'refreshed' };
            mockHandler.mockResolvedValue(freshData);

            const middleware = cacheService.cacheHandler('test', mockHandler, 1800);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.del).toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalled();
            expect(mockAdapter.set).toHaveBeenCalledWith(
                expect.any(String),
                freshData,
                1800
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                result: 'refreshed',
                fromCache: false,
            });
        });

        it('should include userId in cache key when user is authenticated', async () => {
            mockReq.user = { id: 'user123' };
            mockAdapter.get.mockResolvedValue(null);
            mockHandler.mockResolvedValue({ data: 'user-specific' });

            const middleware = cacheService.cacheHandler('profile', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            const cacheKey = mockAdapter.set.mock.calls[0][0];
            expect(cacheKey).toMatch(/^profile:[a-f0-9]{32}$/);
        });

        it('should handle non-object responses', async () => {
            mockAdapter.get.mockResolvedValue(null);
            mockHandler.mockResolvedValue('simple string');

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                data: 'simple string',
                fromCache: false,
            });
        });

        it('should call next with error when handler throws', async () => {
            const error = new Error('Handler failed');
            mockAdapter.get.mockResolvedValue(null);
            mockHandler.mockRejectedValue(error);

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should normalize invalid cache mode to DEFAULT', async () => {
            mockReq.query.cacheMode = 'invalid-mode';
            mockAdapter.get.mockResolvedValue({ cached: 'data' });

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.get).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                cached: 'data',
                fromCache: true,
            });
        });

        it('should use default TTL when not specified', async () => {
            mockAdapter.get.mockResolvedValue(null);
            mockHandler.mockResolvedValue({ data: 'test' });

            const middleware = cacheService.cacheHandler('test', mockHandler);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockAdapter.set).toHaveBeenCalledWith(
                expect.any(String),
                { data: 'test' },
                3600 // default from CacheConstants
            );
        });
    });
});
