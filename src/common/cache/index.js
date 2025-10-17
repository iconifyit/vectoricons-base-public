/* eslint-env node */
const NodeCacheAdapter = require('./adapters/NodeCacheAdapter');
const RedisCacheAdapter = require('./adapters/RedisCacheAdapter');

/**
 * initCacheService(options?)
 * - driver: 'memory' | 'redis' (env: CACHE_DRIVER)
 * - ttl: default TTL in seconds (env: CACHE_TTL)
 * - For redis:
 *   - url: redis connection url (env: REDIS_URL)
 *   - redisOptions: ioredis options
 */
const initCacheService = (options = {}) => {
    const {
        driver = process.env.CACHE_DRIVER || 'memory',
        ttl = Number(process.env.CACHE_TTL || 60),
        url = process.env.REDIS_URL,
        redisOptions = {},
        stdTTL,          // for node-cache
        checkperiod,     // for node-cache
    } = options;

    if (driver === 'redis') {
        return new RedisCacheAdapter({ url, ttl, redisOptions });
    }

    // default: in-memory
    return new NodeCacheAdapter({
        stdTTL: typeof ttl === 'number' ? ttl : 60,
        checkperiod: typeof checkperiod === 'number' ? checkperiod : 120,
    });
};

module.exports = initCacheService;