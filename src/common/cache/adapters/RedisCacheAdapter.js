const IORedis = require('ioredis');

/**
 * @module Caching Layer
 * @fileoverview RedisCacheAdapter - Redis-based cache adapter for production.
 *
 * RedisCacheAdapter
 * Stores values as JSON strings in Redis and rehydrates them into Entity instances
 * when reading via `get()` using the provided repository + entityClass context.
 */
class RedisCacheAdapter {
    /**
     * @param {Object} [options]
     * @param {string} [options.url]           Redis connection URL (e.g., redis://localhost:6379)
     * @param {number} [options.ttl=60]        Default TTL for keys (seconds)
     * @param {Object} [options.redisOptions]  Additional ioredis options
     */
    constructor({ url, ttl = 60, redisOptions = {} } = {}) {
        this.ttl = ttl;
        this.redis = url ? new IORedis(url, redisOptions) : new IORedis(redisOptions);
    }

    /**
     * Get a value by key, JSON-parse it, and rehydrate into Entity instances (if context provided).
     * @param {string} key
     * @param {Object} [ctx]
     * @param {Object} [ctx.repository]        Repository with wrapEntity()
     * @param {Function} [ctx.entityClass]     Entity class constructor
     * @returns {Promise<*>}
     */
    async get(key, ctx = {}) {
        const str = await this.redis.get(key);
        if (str == null) return null;

        let parsed;
        try {
            parsed = JSON.parse(str);
        } catch {
            // If somehow non-JSON snuck in, just return raw string (unlikely in our usage)
            return str;
        }

        const { repository, entityClass } = ctx;
        if (!repository || !entityClass) return parsed;

        // Rehydrate into proper Entity/Entities
        if (Array.isArray(parsed)) {
            return parsed.map(v => repository.wrapEntity(v, entityClass));
        }
        return repository.wrapEntity(parsed, entityClass);
    }

    /**
     * Set a value by key, storing JSON. Accepts entities or plain objects/arrays.
     * @param {string} key
     * @param {*} value
     * @param {number} [ttlSeconds]            Optional TTL override (seconds)
     * @param {Object} [ctx]                    Unused for Redis adapter
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlSeconds, _ctx = {}) {
        // Convert to JSON-safe form (strip methods)
        const json = JSON.stringify(value);
        const ttl = typeof ttlSeconds === 'number' ? ttlSeconds : this.ttl;
        if (ttl > 0) {
            await this.redis.set(key, json, 'EX', ttl);
        } else {
            await this.redis.set(key, json);
        }
        return true;
    }

    /**
     * Delete a specific key.
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async del(key) {
        await this.redis.del(key);
        return true;
    }

    /**
     * Invalidate all keys beginning with the prefix.
     * Uses SCAN to avoid blocking Redis on large keyspaces.
     * @param {string} prefix
     * @returns {Promise<boolean>}
     */
    async invalidatePrefix(prefix) {
        const pattern = `${prefix}*`;
        let cursor = '0';
        do {
            const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
            cursor = next;
            if (keys.length) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
        return true;
    }

    /**
     * Close the Redis connection.
     * @returns {Promise<boolean>}
     */
    async close() {
        await this.redis.quit();
        return true;
    }
}

module.exports = RedisCacheAdapter;