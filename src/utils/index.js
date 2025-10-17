const DB = require('@vectoricons.net/db');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Get a nested property by a string path
 * @param {Object} subject
 * @param {String} path
 * @param {String} fallback
 * @param {String} delim - delimiter
 * @returns {String}
 * @example
 * const obj = { a: { b: { c: 'd' } } };
 * $get(obj, 'a.b.c'); // 'd'
 */
const $get = (obj, path, defaultValue, delim = '.') => {
    return path.split(delim).reduce((o, k) => (o || {})[k], obj) || defaultValue;
}
module.exports.$get = $get;

/**
 * Load YAML file and parse it to an object.
 * @param {String} filePath - path to the YAML file
 * @returns {Object}
 * @throws {Error} If the file does not exist or cannot be parsed.
 */
const yml = (filePath) => {
    if (! filePath || !fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return yaml.parse(fs.readFileSync(filePath, 'utf8')) || {};
}
module.exports.yml = yml;

/**
 * Parse query params from request
 * @param {Object} req
 * @returns {Object}
 * @example:
 * return {
 *   start: 0,
 *   limit: 10,
 *   offset: 1,
 *   search: '',
 *   searchTerm: '',
 *   styleId: '',
 *   user: {},
 *   price: '',
 *   type: '',
 *   teamId: '',
 *   tagIds: [],
 * }
 */
const getRequestVars = (req) => {
    let tagIds = String($get(req, 'params.tags')).split(',');
    if (tagIds?.length) {
        tagIds = tagIds.map((tag) => Number(tag));
    }
    return {
        start         : getStartParam($get(req, 'params.start', 0)),
        limit         : getLimitParam($get(req, 'params.limit')),
        offset        : getOffsetParam($get(req, 'params.offset', 1)),
        // ==============================================================
        // TODO: search & searchTerm are the same thing. This is known  
        // tech debt that should be fixed.
        // ==============================================================
        search        : String($get(req, 'query.search', '')).trim().toLowerCase(),
        searchTerm    : String($get(req, 'query.search', '')).trim().toLowerCase(),
        styleId       : $get(req, 'query.styleId', ''),
        parentId      : $get(req, 'query.parentId', ''),
        sort          : $get(req, 'query.sort', ''),
        user          : $get(req, 'user'),
        price         : $get(req, 'params.price'),
        type          : $get(req, 'params.type'),
        teamId        : $get(req, 'params.teamId'),
        userId        : $get(req, 'params.userId'),
        setId         : $get(req, 'params.setId'),
        tagIds        : tagIds,
        uuid          : $get(req, 'params.uuid'),
    }
}
module.exports.getRequestVars = getRequestVars;

/**
 * Validate the number params
 * @param {Object} req
 * @returns {Boolean}
 */
const validateNumberParams = (req) => {
    const { start, limit, offset } = getRequestVars(req);
    if (Number.isNaN(Number(start))) return false;
    if (Number.isNaN(Number(limit))) return false;
    if (Number.isNaN(Number(offset))) return false;
    if (Number.isNaN(Number(offset))) return false;
    return true;
}
module.exports.validateNumberParams = validateNumberParams;

/**
 * Get the start and limit params from the request
 * @param {Number} start
 * @param {Number} limit
 * @param {Number} count
 * @returns {Object}
 */
const getStartAndLimit = (start = 0, limit = config.MAX_RESULTS_LIMIT, count = 0) => {
    limit = !limit ? config.MAX_RESULTS_LIMIT : limit;
    start = Math.min(
        Math.max(0, Number(start)),
        count
    );
    return { start, limit };
}
module.exports.getStartAndLimit = getStartAndLimit;

/**
 * Get user from Request object.
 * @param {Object} req - the request object
 * @returns {Object}
 */
const getUserFromRequest = async (req) => {
    const uuid = $get(req, 'user.uuid');

    if (! isUUID(uuid)) {
        throw new Error('User not found');
    }

    const user = await DB.users.query().findOne({uuid: uuid});

    // console.log('getUserFromRequest', user)

    if (! user) {
        throw new Error('User not found');
    }
    return user;
}
module.exports.getUserFromRequest = getUserFromRequest;

/**
 * Get the product type param from the request
 * @param {Object} req
 * @returns {String} - PRODUCT_TYPE_ICON or PRODUCT_TYPE_ILLUSTRATION
 */
const getProductTypeParam = (req) => {
    let typeParam = String($get(req, 'params.type', '')).toUpperCase();
    if (!['ICON', 'ILLUSTRATION'].includes(typeParam)) {
        return false;
    }
    return `PRODUCT_TYPE_${typeParam}`
}
module.exports.getProductTypeParam = getProductTypeParam;

/**
 * Get the price param from the request
 * @param {Object} req
 * @returns {String} - FREE or PREMIUM
 */
const getPriceParam = (req) => {
    let theParam;
    theParam = String($get(req, 'params.price', '')).toUpperCase();
    theParam = String($get(req, 'query.price', theParam)).toUpperCase();
    if (!['FREE', 'PREMIUM', 'ALL'].includes(theParam)) {
        return 'ALL';
    }
    return theParam.toUpperCase();
}
module.exports.getPriceParam = getPriceParam;

// utils/deepFreeze.js
const deepFreeze_old = (obj) => {
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
        const value = obj[key];
        if (
            value &&
            typeof value === 'object' &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value);
        }
    }
    return obj;
}


// deep-freeze with cycle protection and symbol support.
// Freezes children first, then the parent.
const deepFreeze = (value, seen = new WeakSet()) => {
    if (value == null || typeof value !== 'object' || seen.has(value)) return value;

    seen.add(value);

    if (Array.isArray(value)) {
        for (const item of value) {
            deepFreeze(item, seen);
        }
    } 
    else {
        // Reflect.ownKeys covers string + symbol keys
        for (const key of Reflect.ownKeys(value)) {
            // Avoid triggering getters; only recurse into data properties
            const desc = Object.getOwnPropertyDescriptor(value, key);
            if (desc && 'value' in desc) {
                deepFreeze(desc.value, seen);
            }
        }
    }

    return Object.freeze(value);
};

module.exports.deepFreeze = deepFreeze;