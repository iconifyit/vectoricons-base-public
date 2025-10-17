// CacheAdapter.js
class CacheAdapter {
    async get(key)       { throw new Error('Not implemented'); }
    async set(key, val, ttl) { throw new Error('Not implemented'); }
    async del(key)       { throw new Error('Not implemented'); }
    async keys(pattern)  { throw new Error('Not implemented'); }
}

module.exports = CacheAdapter;