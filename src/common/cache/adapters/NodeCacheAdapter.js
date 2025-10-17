const NodeCache = require('node-cache');

/**
 * @module Caching Layer
 * @fileoverview NodeCacheAdapter - In-memory cache adapter for development and testing.
 *
 * NodeCacheAdapter
 * In-memory cache that stores values as-is (no serialization).
 * Returns hydrated Entity instances by using the provided repository + entityClass
 * in the `get()` call context.
 */
class NodeCacheAdapter {
    /**
     * @param {Object} [options]
     * @param {number} [options.stdTTL=60]     Default TTL (seconds)
     * @param {number} [options.checkperiod=120] How often to check for expired keys (seconds)
     */
    constructor({ stdTTL = 60, checkperiod = 120 } = {}) {
        this.cache = new NodeCache({
            stdTTL,
            checkperiod,
            useClones: false, // store references, avoid deep cloning
        });
    }

    /**
     * Get a value by key and rehydrate into Entity instances (if context provided).
     * @param {string} key
     * @param {Object} [ctx]
     * @param {Object} [ctx.repository]        Repository with wrapEntity()
     * @param {Function} [ctx.entityClass]     Entity class constructor
     * @returns {Promise<*>}
     */
    async get(key, ctx = {}) {
        const value = this.cache.get(key);
        if (value == null) return null;

        const { repository, entityClass } = ctx;

        // If no context, just return stored value as-is.
        if (!repository || !entityClass) return value;

        // If it's already an instance (or array of instances), return it.
        const isEntity = (v) => v && typeof v === 'object' && v instanceof entityClass;
        if (Array.isArray(value)) {
            if (value.length === 0) return value;
            if (value.every(isEntity)) return value;
            return value.map(v => repository.wrapEntity(v, entityClass));
        }
        if (isEntity(value)) return value;

        // Otherwise wrap into proper Entity
        return repository.wrapEntity(value, entityClass);
    }

    /**
     * Set a value by key. Stores as-is (entities are kept intact).
     * @param {string} key
     * @param {*} value
     * @param {number} [ttlSeconds]            Optional TTL override (seconds)
     * @param {Object} [ctx]                    Unused for Node adapter
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlSeconds, _ctx = {}) {
        // ttlSeconds optional; falls back to stdTTL if undefined
        this.cache.set(key, value, ttlSeconds);
        return true;
    }

    /**
     * Delete a specific key.
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async del(key) {
        this.cache.del(key);
        return true;
    }

    /**
     * Invalidate all keys that start with the given prefix.
     * @param {string} prefix
     * @returns {Promise<boolean>}
     */
    async invalidatePrefix(prefix) {
        const keys = this.cache.keys();
        const toDelete = keys.filter(k => k.startsWith(prefix));
        if (toDelete.length) this.cache.del(toDelete);
        return true;
    }

    /**
     * Close the cache.
     * @returns {Promise<boolean>}
     */
    async close() {
        this.cache.close();
        return true;
    }
}

module.exports = NodeCacheAdapter;