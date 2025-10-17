const crypto = require('crypto');
const { CacheModes, kCACHE_DEFAULT_TTL } = require('./CacheConstants');
const utils = require('../../utils');

/**
 * @fileoverview CacheService - Adapter-based caching layer with entity rehydration.
 *
 * This service provides a flexible caching abstraction that supports multiple backends
 * via the Adapter Pattern. It's integrated throughout the service layer to provide
 * automatic read-through caching with entity rehydration.
 *
 * **Adapter Pattern:**
 * ```
 * ┌─────────────────┐
 * │  CacheService   │  ← Application code uses this
 * └────────┬────────┘
 *          │ (adapter interface)
 *          ├─────────────────┬─────────────────┬──────────────────
 *          ↓                 ↓                 ↓
 *   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 *   │  InMemory    │  │    Redis     │  │   Datadog    │
 *   │   Adapter    │  │   Adapter    │  │   Adapter    │
 *   └──────────────┘  └──────────────┘  └──────────────┘
 *   (tests, dev)      (production)      (observability)
 * ```
 *
 * **Cache Modes:**
 * - `DEFAULT`: Normal cache behavior (read-through, write-through)
 * - `SKIP`: Bypass cache entirely (always fetch fresh)
 * - `BUST`: Clear cache entry and fetch fresh data (no re-cache)
 * - `REFRESH`: Clear cache entry, fetch fresh, and update cache
 *
 * **Entity Rehydration:**
 * When used with the `withCacheable` mixin, cached data is automatically converted
 * back to Entity instances. This ensures type safety and method availability after
 * cache retrieval:
 * ```javascript
 * // First call - fetches from DB, returns IconEntity, caches plain object
 * const icon1 = await iconService.getById(123); // IconEntity instance
 *
 * // Second call - fetches from cache, rehydrates to IconEntity
 * const icon2 = await iconService.getById(123); // IconEntity instance (rehydrated)
 *
 * console.log(icon1 instanceof IconEntity); // true
 * console.log(icon2 instanceof IconEntity); // true (rehydrated from cache!)
 * ```
 *
 * **Production Integration:**
 * ```
 * HTTP Layer (Express/Fastify routes)
 *      ↓
 * CacheService.cacheHandler() middleware  ← HTTP-level caching
 *      ↓
 * Service Layer (with withCacheable mixin) ← Method-level caching
 *      ↓
 * Repository Layer (database queries)
 * ```
 *
 * **Key Features:**
 * - Adapter Pattern: Swap backends (InMemory, Redis, Datadog) without code changes
 * - Consistent Key Generation: Same parameters → same key (order-independent)
 * - User-Specific Caching: Automatic user ID inclusion for authenticated requests
 * - TTL Support: Time-to-live for automatic cache expiration
 * - Prefix-Based Invalidation: Clear all cache entries with specific prefix
 * - Entity Rehydration: Automatic conversion from plain objects to Entity instances
 * - Cache Mode Control: Client can control caching behavior via query params
 *
 * @example
 * // Basic setup with InMemory adapter (development/testing)
 * const cache = new CacheService(new NodeCacheAdapter());
 * const key = cache.getCacheKey('users:list', { page: 1, limit: 10 });
 *
 * @example
 * // Production setup with Redis adapter
 * const redis = require('redis');
 * const client = redis.createClient({ url: process.env.REDIS_URL });
 * const cache = new CacheService(new RedisAdapter(client));
 *
 * @example
 * // HTTP middleware for route-level caching
 * app.get('/api/icons',
 *   cache.cacheHandler('icons:list', async (req) => {
 *     return iconService.getAll(req.query);
 *   }, 3600)
 * );
 * // GET /api/icons              - Returns cached data if available
 * // GET /api/icons?cacheMode=skip    - Always fetches fresh
 * // GET /api/icons?cacheMode=refresh - Updates cache
 *
 * @example
 * // Service-level caching with entity rehydration (via withCacheable mixin)
 * class IconService extends withCacheable(BaseService) {
 *   // getById() automatically cached and rehydrated to IconEntity
 * }
 * const icon = await iconService.getById(123); // Cached after first call
 *
 * @see {@link withCacheable} For service-level caching mixin
 * @see {@link CacheModes} For available cache modes
 */

/**
 * Cache service with adapter pattern for flexible backend support.
 *
 * CacheService provides a unified caching API that works with multiple backends
 * (InMemory, Redis, Datadog) via adapter pattern. It's used at two levels:
 *
 * 1. **HTTP Layer**: Via cacheHandler() middleware for route-level caching
 * 2. **Service Layer**: Via withCacheable() mixin for method-level caching with entity rehydration
 *
 * **Adapter Requirements:**
 * All adapters must implement this interface:
 * ```typescript
 * interface CacheAdapter {
 *   get(key: string): Promise<any>;
 *   set(key: string, value: any, ttl?: number): Promise<void>;
 *   del(keys: string | string[]): Promise<void>;
 *   keys(): Promise<string[]>;
 * }
 * ```
 *
 * **Cache Key Generation:**
 * Keys are deterministic - same parameters always generate same key regardless of order:
 * ```javascript
 * cache.getCacheKey('icons', { page: 1, limit: 10 });
 * cache.getCacheKey('icons', { limit: 10, page: 1 });
 * // Both produce: 'icons:a1b2c3d4e5f6...'
 * ```
 *
 * **Performance Characteristics:**
 * - InMemory: ~0.01ms per operation (development/testing)
 * - Redis: ~1-5ms per operation (production, network overhead)
 * - Datadog: ~10-50ms per operation (observability, write-heavy)
 *
 * @class CacheService
 *
 * @example
 * // Development setup with InMemory adapter
 * const NodeCache = require('node-cache');
 * const cache = new CacheService(new NodeCacheAdapter(new NodeCache()));
 *
 * @example
 * // Production setup with Redis adapter
 * const redis = require('redis');
 * const client = await redis.createClient({
 *   url: process.env.REDIS_URL,
 *   socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 500) }
 * }).connect();
 * const cache = new CacheService(new RedisAdapter(client));
 *
 * @example
 * // HTTP route caching
 * app.get('/api/icons/:id',
 *   cache.cacheHandler('icons:detail', async (req) => {
 *     return iconService.getById(req.params.id);
 *   }, 3600)
 * );
 *
 * @example
 * // Service-level caching (automatic with withCacheable mixin)
 * class IconService extends withCacheable(BaseService) {
 *   // All methods like getById() are automatically cached
 * }
 */
class CacheService {
    /**
     * Construct CacheService with cache adapter.
     *
     * The adapter pattern allows swapping cache backends without changing application code.
     * Common adapters include:
     * - **NodeCacheAdapter**: In-memory caching for development/testing
     * - **RedisAdapter**: Production-ready distributed caching
     * - **DatadogAdapter**: Metrics collection and observability
     *
     * **Adapter Interface:**
     * All adapters must implement: get(), set(), del(), keys()
     *
     * @param {Object} adapter - Cache adapter implementing required interface
     * @param {Function} adapter.get - Retrieve value by key: `async get(key: string) => any`
     * @param {Function} adapter.set - Store value with optional TTL: `async set(key: string, value: any, ttl?: number) => void`
     * @param {Function} adapter.del - Delete one or more keys: `async del(keys: string | string[]) => void`
     * @param {Function} adapter.keys - List all keys: `async keys() => string[]`
     *
     * @throws {Error} If adapter is invalid or missing required methods
     *
     * @example
     * // InMemory adapter for development
     * const cache = new CacheService(new NodeCacheAdapter());
     *
     * @example
     * // Redis adapter for production
     * const redisClient = redis.createClient({ url: process.env.REDIS_URL });
     * await redisClient.connect();
     * const cache = new CacheService(new RedisAdapter(redisClient));
     *
     * @example
     * // Custom adapter implementation
     * class CustomAdapter {
     *   async get(key) { /* ... */ }
     *   async set(key, value, ttl) { /* ... */ }
     *   async del(keys) { /* ... */ }
     *   async keys() { /* ... */ }
     * }
     * const cache = new CacheService(new CustomAdapter());
     */
    constructor(adapter) {
        if (!adapter || typeof adapter.get !== 'function') {
            throw new Error('A valid cache adapter is required');
        }

        /**
         * The cache adapter instance.
         * @type {Object}
         * @private
         */
        this.adapter = adapter;
    }

    /**
     * Generates a consistent cache key from base key, parameters, and user ID.
     *
     * Keys are generated by:
     * 1. Sorting parameter keys alphabetically
     * 2. Serializing values (objects sorted by keys)
     * 3. Appending user ID if provided
     * 4. Hashing the combined string with MD5
     *
     * This ensures the same parameters always generate the same key,
     * regardless of parameter order.
     *
     * @param {string} baseKey - The base cache key (e.g., 'users:list', 'products:detail')
     * @param {Object} [params={}] - Query parameters or options
     * @param {number|string} [userId=null] - User ID for user-specific caching
     *
     * @returns {string} Hashed cache key in format 'baseKey:hash'
     *
     * @example
     * const key1 = cache.getCacheKey('icons', { page: 1, limit: 10 });
     * const key2 = cache.getCacheKey('icons', { limit: 10, page: 1 });
     * // key1 === key2 (order doesn't matter)
     *
     * @example
     * // User-specific caching
     * const key = cache.getCacheKey('favorites', { page: 1 }, userId);
     * // Returns: 'favorites:abc123def456...'
     *
     * @example
     * // With object parameters
     * const key = cache.getCacheKey('search', {
     *   filters: { category: 'icons', style: 'outline' },
     *   sort: 'name'
     * });
     */
    getCacheKey(baseKey, params = {}, userId = null) {
        const sortedKeys = Object.keys(params).sort();
        const keyParts = sortedKeys.map(key => {
            const val = params[key];
            const serialized = typeof val === 'object'
                ? JSON.stringify(val, Object.keys(val).sort())
                : String(val);
            return `${key}:${serialized}`;
        });

        if (userId) {
            keyParts.push(`userId:${userId}`);
        }

        const rawKey = `${baseKey}:${keyParts.join('|')}`;
        const hash = crypto.createHash('md5').update(rawKey).digest('hex');
        return `${baseKey}:${hash}`;
    }

    /**
     * Express/Fastify middleware for automatic request caching.
     *
     * Supports cache modes via query parameter `?cacheMode=skip|bust|refresh`:
     * - DEFAULT: Return cached data if available, otherwise fetch and cache
     * - SKIP: Bypass cache, always fetch fresh data
     * - BUST: Clear cache entry, fetch fresh data, don't re-cache
     * - REFRESH: Clear cache entry, fetch fresh data, cache the result
     *
     * The middleware automatically:
     * - Generates cache keys from request parameters
     * - Includes user ID in cache key if authenticated
     * - Adds `fromCache: true/false` to response
     * - Handles errors with next()
     *
     * @param {string} baseKey - Base cache key for this route
     * @param {Function} handler - Async function that returns data: `async (req) => data`
     * @param {number} [ttl=kCACHE_DEFAULT_TTL] - Time-to-live in seconds
     *
     * @returns {Function} Express/Fastify middleware function
     *
     * @example
     * // Basic usage
     * app.get('/api/icons',
     *   cache.cacheHandler('icons:list', async (req) => {
     *     return iconService.getAll(req.query);
     *   }, 3600)
     * );
     *
     * @example
     * // Client can control cache behavior:
     * // GET /api/icons?cacheMode=skip    - Always fresh
     * // GET /api/icons?cacheMode=bust    - Clear and fetch
     * // GET /api/icons?cacheMode=refresh - Update cache
     *
     * @example
     * // With authentication
     * app.get('/api/favorites',
     *   authenticate,
     *   cache.cacheHandler('favorites', async (req) => {
     *     return favoriteService.getUserFavorites(req.user.id);
     *   })
     * );
     * // Cache key includes user.id automatically
     */
    cacheHandler(baseKey, handler, ttl = kCACHE_DEFAULT_TTL) {
        return async (req, res, next) => {
            try {
                const params = utils.getRequestVars(req);
                const userId = req?.user?.id;
                const fullKey = this.getCacheKey(baseKey, params, userId);
                const mode = (req.query.cacheMode || CacheModes.DEFAULT).toLowerCase();

                const formatResult = (data, fromCache) => {
                    if (typeof data === 'object' && data !== null) {
                        return { ...data, fromCache };
                    }
                    return { data, fromCache };
                };

                const getMode = (value) => {
                    return Object.values(CacheModes).includes(value)
                        ? value
                        : CacheModes.DEFAULT;
                };

                switch (getMode(mode)) {
                    case CacheModes.SKIP:
                        return res.status(200).json(formatResult(await handler(req), false));

                    case CacheModes.BUST:
                        await this.adapter.del(fullKey);
                        return res.status(200).json(formatResult(await handler(req), false));

                    case CacheModes.REFRESH:
                        await this.adapter.del(fullKey);
                        const refreshed = await handler(req);
                        await this.adapter.set(fullKey, refreshed, ttl);
                        return res.status(200).json(formatResult(refreshed, false));

                    default:
                        const cached = await this.adapter.get(fullKey);
                        if (cached) {
                            return res.status(200).json(formatResult(cached, true));
                        }
                        const result = await handler(req);
                        await this.adapter.set(fullKey, result, ttl);
                        return res.status(200).json(formatResult(result, false));
                }
            }
            catch (err) {
                next(err);
            }
        };
    }

    /**
     * Clears cache entries by base key prefix or custom matcher function.
     *
     * Useful for cache invalidation when data changes:
     * - Clear all keys with a specific prefix
     * - Clear keys matching custom criteria
     * - Clear all keys (no parameters)
     *
     * @async
     * @param {Object} [options={}] - Clearing options
     * @param {string} [options.baseKey] - Clear all keys starting with this prefix
     * @param {Function} [options.matcher] - Custom function to filter keys: `(key) => boolean`
     *
     * @returns {Promise<number>} Number of keys cleared
     *
     * @example
     * // Clear all icon-related cache entries
     * await cache.clearCache({ baseKey: 'icons' });
     * // Clears: icons:list, icons:detail:*, etc.
     *
     * @example
     * // Clear with custom matcher
     * await cache.clearCache({
     *   matcher: (key) => key.includes('user:123')
     * });
     *
     * @example
     * // Clear all cache entries
     * await cache.clearCache();
     *
     * @example
     * // Clear after data update
     * await iconService.updateIcon(id, data);
     * await cache.clearCache({ baseKey: 'icons' });
     */
    async clearCache({ baseKey, matcher } = {}) {
        const keys = await this.adapter.keys();
        let matched = keys;

        if (typeof matcher === 'function') {
            matched = keys.filter(matcher);
        }
        else if (baseKey) {
            matched = keys.filter(k => k.startsWith(`${baseKey}:`));
        }

        await this.adapter.del(matched);
        console.log(`[CacheService] Cleared ${matched.length} key(s)`, matched);
        return matched.length;
    }
}

module.exports = CacheService;
