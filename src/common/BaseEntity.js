/* eslint-env node */

const Inflector = require('inflected');

/**
 * BaseEntity and factory for model-backed entities.
 * Unknown fields are ignored unless declared as related entities.
 */
class BaseEntity {

    hiddenFields = [];

    /**
     * Construct from arbitrary data, keeping only non-hidden fields.
     * @param {Object} data
     * @param {Object} [entityOptions={}]
     * @param {boolean} [entityOptions.includeHiddenFields=false]
     */
    constructor(data = {}, entityOptions = {}) {
        if (!data || typeof data !== 'object') {
            return;
        }

        const shouldIncludeHidden = entityOptions.includeHiddenFields === true;
        const hidden = this.constructor.hiddenFields || [];

        // Only filter hidden fields if includeHiddenFields is false
        if (!shouldIncludeHidden) {
            for (const field of hidden) {
                if (field in data) {
                    delete data[field];
                }
            }
        }

        Object.assign(this, data);
    }

    /**
     * Create a new instance copying current data and applying updates.
     * @param {Object} updates
     * @returns {this}
     */
    cloneWith(updates = {}) {
        return new this.constructor({ ...this, ...updates });
    }

    /**
     * Serialize to plain JSON, recursing into nested entities.
     * @returns {Object}
     */
    toJSON() {
        const json = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            if (key === 'hiddenFields' || key === 'constructor') {
                continue;
            }

            const val = this[key];

            if (Array.isArray(val)) {
                json[key] = val.map(item =>
                    typeof item?.toJSON === 'function' ? item.toJSON() : item
                );
            }
            else if (typeof val?.toJSON === 'function') {
                json[key] = val.toJSON();
            }
            else {
                json[key] = val;
            }
        }
        return json;
    }
}

/**
 * Factory to create an entity class from an Objection.js model.
 *
 * Unknown fields are ignored. Related entity fields are materialized only if
 * declared in `relatedEntities`. Everything else is dropped.
 *
 * Also derives a static JSON schema (camelCase keys) at class creation time,
 * based on the ModelClass.jsonSchema, with hiddenFields removed.
 *
 * @param {Object} ModelClass
 * @param {Object} [extraMethods={}]
 * @param {Object} [options={}]
 * @param {Array<string>} [options.hiddenFields=[]]
 * @param {Array<string>} [options.allowedColumns=[]]  // explicit allowlist (camel or snake)
 * @param {Object<string,Function>} [options.relatedEntities={}] functions returning Entity classes
 * @param {boolean} [options.freeze=true]  // freeze instances by default
 * @returns {Function} Entity class
 */
const createEntityFromModel = (
    ModelClass,
    extraMethods = {},
    { hiddenFields = [], allowedColumns = [], relatedEntities = {}, freeze = true } = {}
) => {
    const toCamel = (s) => Inflector.camelize(s, false);

    const modelProps = ModelClass?.jsonSchema?.properties || {};
    const modelRequired = Array.isArray(ModelClass?.jsonSchema?.required)
        ? ModelClass.jsonSchema.required
        : [];

    // Debug helpers (retain if useful during build-time generation)
    console.log('ModelClass.jsonSchema', ModelClass.jsonSchema?.properties);
    if (ModelClass?.getColumnNames) {
        console.log('ModelClass columns:', ModelClass.getColumnNames().join(', '));
    }

    const hiddenSet  = new Set((hiddenFields || []).map(toCamel));
    const allowedSet = new Set((allowedColumns || []).map(toCamel)); // empty => allow all (minus hidden)

    console.log('Entity hidden fields:', Array.from(hiddenSet).join(', '));
    console.log('Entity allowed columns:', allowedSet.size > 0 ? Array.from(allowedSet).join(', ') : '(all)');

    const mapProp = (key, def) => {
        const type = def?.type;
        const out = {};

        if (type === 'string') {
            out.type = 'string';
            const lower = key.toLowerCase();
            if (lower.endsWith('at') || lower.endsWith('_at') || lower.endsWith('date') || lower.endsWith('_date')) {
                out.format = 'date-time';
            }
            if (def?.maxLength) {
                out.maxLength = def.maxLength;
            }
            if (Array.isArray(def?.enum)) {
                out.enum = def.enum.slice();
            }
            return out;
        }

        if (type === 'integer') {
            out.type = 'integer';
            return out;
        }

        if (type === 'number') {
            out.type = 'number';
            return out;
        }

        if (type === 'boolean') {
            out.type = 'boolean';
            return out;
        }

        if (type === 'array') {
            out.type = 'array';
            if (def?.items) {
                out.items = typeof def.items === 'object' ? { ...def.items } : {};
            }
            return out;
        }

        if (type === 'object') {
            out.type = 'object';
            if (def?.properties) {
                out.properties = Object.fromEntries(
                    Object.entries(def.properties).map(([propKey, propDef]) => [toCamel(propKey), mapProp(propKey, propDef)])
                );
            }
            if (Array.isArray(def?.required)) {
                out.required = def.required.map(toCamel);
            }
            return out;
        }

        return {};
    };

    const entityProperties = Object.fromEntries(
        Object.entries(modelProps)
            .map(([snakeKey, def]) => [toCamel(snakeKey), mapProp(snakeKey, def)])
            .filter(([camelKey]) => {
                if (hiddenSet.has(camelKey)) return false;
                if (allowedSet.size > 0 && !allowedSet.has(camelKey)) return false;
                return true;
            })
    );

    const entityRequired = modelRequired
        .map(toCamel)
        .filter((key) => !hiddenSet.has(key))
        .filter((key) => allowedSet.size === 0 || allowedSet.has(key));

    const derivedJsonSchema = {
        type: 'object',
        properties: entityProperties,
    };
    if (entityRequired.length > 0) {
        derivedJsonSchema.required = entityRequired;
    }

    class ModelEntity extends BaseEntity {
        static relatedEntities = relatedEntities;
        static hiddenFields = hiddenFields;
        static allowedColumns = allowedColumns;

        static _relatedEntityCache = new Map();

        static _getRelatedEntityClass(key) {
            const loader = this.relatedEntities?.[key];
            if (!loader) return null;

            if (this._relatedEntityCache.has(key)) {
                return this._relatedEntityCache.get(key);
            }

            if (typeof loader !== 'function') {
                throw new Error(`relatedEntities.${key} must be a function returning the Entity class`);
            }

            const EntityClass = loader();
            if (!EntityClass) {
                throw new Error(`relatedEntities.${key}() returned a falsy value`);
            }

            this._relatedEntityCache.set(key, EntityClass);
            return EntityClass;
        }

        constructor(data = {}, entityOptions = {}) {
            const schemaProps = ModelClass.jsonSchema?.properties || {};

            const schemaCamel = Object.keys(schemaProps).reduce((acc, key) => {
                acc[toCamel(key)] = true;
                return acc;
            }, {});

            const dataCamel = mapKeys(data, (key) => toCamel(key));

            const baseFields = {};
            const relationCandidates = {};

            for (const [key, val] of Object.entries(dataCamel)) {
                if (schemaCamel[key]) {
                    baseFields[key] = val;
                } else {
                    relationCandidates[key] = val;
                }
            }

            // Apply hidden + allowed filtering before assigning base fields
            // Unless includeHiddenFields is true, then skip hidden field filtering
            const filteredBaseFields = {};
            const shouldIncludeHidden = entityOptions.includeHiddenFields === true;

            for (const [key, val] of Object.entries(baseFields)) {
                if (!shouldIncludeHidden && hiddenSet.has(key)) continue;
                if (allowedSet.size > 0 && !allowedSet.has(key)) continue;
                filteredBaseFields[key] = val;
            }

            super(filteredBaseFields, entityOptions);

            for (const [key, val] of Object.entries(relationCandidates)) {
                const Related = this.constructor._getRelatedEntityClass(key);
                if (!Related) continue;

                this[key] = Array.isArray(val)
                    ? val.map((entry) => new Related(entry))
                    : new Related(val);
            }

            // Freeze instances by default (opt-out via options.freeze = false)
            if (freeze) {
                Object.freeze(this);
            }
        }

        static getJsonSchema() {
            return derivedJsonSchema;
        }
    }

    Object.defineProperty(ModelEntity, 'jsonSchema', {
        value: derivedJsonSchema,
        enumerable: true,
        configurable: false,
        writable: false,
    });

    Object.assign(ModelEntity.prototype, extraMethods);

    return ModelEntity;
};

/**
 * Map an object's keys using a transform function.
 * @param {Object} obj
 * @param {(k:string)=>string} fn
 * @returns {Object}
 */
const mapKeys = (obj, fn) => {
    if (!obj || typeof obj !== 'object') {
        return {};
    }
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
        out[fn(key)] = val;
    }
    return out;
}

module.exports = {
    BaseEntity,
    createEntityFromModel,
};