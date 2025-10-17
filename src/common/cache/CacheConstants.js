const CacheModes = {
    SKIP    : 'skip',
    BUST    : 'bust',
    REFRESH : 'refresh',
    DEFAULT : 'default',
};

const kCACHE_DEFAULT_TTL = parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 3600;

module.exports = { CacheModes, kCACHE_DEFAULT_TTL };