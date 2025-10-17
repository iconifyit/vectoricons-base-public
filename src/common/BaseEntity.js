/* eslint-env node */

/**
 * @module Core Infrastructure
 * @fileoverview BaseEntity class and factory for creating immutable entity instances from Objection.js models.
 *
 * This module provides the foundation for the Entity layer in our Service-Oriented Architecture.
 * Entities are immutable, validated data transfer objects that represent domain models.
 *
 * **Key Features:**
 * - Automatic camelCase conversion from snake_case database columns
 * - Hidden field filtering (e.g., passwords, tokens)
 * - Allowed column whitelisting for precise control
 * - Related entity materialization (nested objects/arrays)
 * - JSON schema derivation from Objection.js models
 * - Immutable by default (frozen instances)
 *
 * **Usage Pattern:**
 * ```javascript
 * // Define entity from Objection model
 * const IconEntity = createEntityFromModel(IconModel, {
 *   // Extra methods
 *   isPublished() { return this.isActive && !this.isDeleted; }
 * }, {
 *   hiddenFields: ['internalId', 'secretKey'],
 *   relatedEntities: {
 *     set: () => SetEntity,
 *     images: () => ImageEntity
 *   }
 * });
 *
 * // Use in service layer
 * const icon = new IconEntity(dbRow);
 * console.log(icon.svgPath); // camelCase
 * console.log(icon.secretKey); // undefined (hidden)
 * Object.isFrozen(icon); // true
 * ```
 *
 * @see {@link https://vincit.github.io/objection.js/ Objection.js Documentation}
 */

const Inflector = require('inflected');

/**
 * Base class for all domain entities.
 *
 * Provides core functionality for data transfer objects including serialization,
 * cloning, and hidden field management. All entities in the system extend this class
 * either directly or via createEntityFromModel factory.
 *
 * **Design Philosophy:**
 * - Entities are immutable value objects
 * - Entities should not contain business logic (use Services)
 * - Entities are serializable (toJSON) for API responses
 * - Entities filter sensitive data automatically
 *
 * @class
 * @example
 * // Direct usage (rare, usually use createEntityFromModel)
 * class UserEntity extends BaseEntity {
 *   static hiddenFields = ['password', 'resetToken'];
 * }
 *
 * const user = new UserEntity({ id: 1, email: 'user@example.com', password: 'secret' });
 * console.log(user.password); // undefined (filtered by hiddenFields)
 */
class BaseEntity {

    hiddenFields = [];

    /**
     * Construct entity instance from arbitrary data, automatically filtering hidden fields.
     *
     * Hidden fields (e.g., passwords, tokens) are removed unless explicitly requested
     * via entityOptions.includeHiddenFields = true. This ensures sensitive data is not
     * accidentally exposed in API responses.
     *
     * @param {Object} data - Raw data object (typically from database or API)
     * @param {Object} [entityOptions={}] - Entity construction options
     * @param {boolean} [entityOptions.includeHiddenFields=false] - If true, retain hidden fields
     *
     * @example
     * // Without hidden fields (default)
     * const user = new UserEntity({ id: 1, email: 'user@example.com', password: 'secret' });
     * console.log(user.password); // undefined
     *
     * @example
     * // With hidden fields (for internal operations)
     * const user = new UserEntity(
     *   { id: 1, email: 'user@example.com', password: 'secret' },
     *   { includeHiddenFields: true }
     * );
     * console.log(user.password); // 'secret'
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
     * Create a new entity instance by cloning current data and applying updates.
     *
     * Since entities are immutable (frozen), this method provides a way to create
     * a modified version without mutating the original. Useful for applying partial
     * updates while preserving immutability.
     *
     * @param {Object} updates - Fields to add/override in the cloned instance
     * @returns {this} New entity instance with updates applied
     *
     * @example
     * const icon1 = new IconEntity({ id: 1, name: 'home', isActive: true });
     * const icon2 = icon1.cloneWith({ name: 'home-alt' });
     *
     * console.log(icon1.name); // 'home' (unchanged)
     * console.log(icon2.name); // 'home-alt'
     * console.log(icon2.id);   // 1 (copied from original)
     * console.log(icon1 !== icon2); // true (different instances)
     */
    cloneWith(updates = {}) {
        return new this.constructor({ ...this, ...updates });
    }

    /**
     * Serialize entity to plain JSON object, recursively converting nested entities.
     *
     * This method is automatically called by JSON.stringify() and ensures all nested
     * entities (arrays or single objects) are also serialized properly. Essential for
     * API responses where entities need to be converted to plain JSON.
     *
     * @returns {Object} Plain JavaScript object suitable for JSON serialization
     *
     * @example
     * const icon = new IconEntity({
     *   id: 1,
     *   name: 'home',
     *   set: new SetEntity({ id: 10, name: 'Material' }),
     *   images: [
     *     new ImageEntity({ id: 100, url: '/img1.png' }),
     *     new ImageEntity({ id: 101, url: '/img2.png' })
     *   ]
     * });
     *
     * const json = icon.toJSON();
     * // All nested entities converted to plain objects
     * console.log(json.set.name); // 'Material'
     * console.log(json.images[0].url); // '/img1.png'
     *
     * @example
     * // Automatic usage with JSON.stringify
     * const icon = new IconEntity({ id: 1, name: 'home' });
     * const str = JSON.stringify(icon);
     * console.log(str); // '{"id":1,"name":"home"}'
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
 * Factory function to create an immutable Entity class from an Objection.js Model.
 *
 * This is the primary way to define entities in the system. It automatically:
 * - Converts snake_case database columns to camelCase entity properties
 * - Derives a JSON schema from the Model's jsonSchema
 * - Filters hidden fields (passwords, tokens, etc.)
 * - Materializes related entities (lazy-loaded to avoid circular dependencies)
 * - Freezes instances for immutability
 * - Validates data against the derived schema
 *
 * **Why This Pattern?**
 * - **Separation of Concerns**: Database models (Objection) vs. domain entities (business logic)
 * - **Immutability**: Frozen entities prevent accidental mutations
 * - **Type Safety**: JSON schema provides runtime validation
 * - **Security**: Hidden fields prevent sensitive data leakage
 * - **Flexibility**: Related entities can be included/excluded dynamically
 *
 * @param {Object} ModelClass - Objection.js Model class with jsonSchema
 * @param {Object} [extraMethods={}] - Additional methods to add to entity instances
 * @param {Object} [options={}] - Entity configuration options
 * @param {Array<string>} [options.hiddenFields=[]] - Fields to hide (e.g., ['password', 'resetToken'])
 * @param {Array<string>} [options.allowedColumns=[]] - If provided, only these fields are included (whitelist)
 * @param {Object<string,Function>} [options.relatedEntities={}] - Related entity loaders (lazy functions)
 * @param {boolean} [options.freeze=true] - Whether to freeze instances (default: true)
 *
 * @returns {Function} Entity class extending BaseEntity with derived schema
 *
 * @example
 * // Basic entity
 * const IconEntity = createEntityFromModel(IconModel, {}, {
 *   hiddenFields: ['internalId']
 * });
 *
 * const icon = new IconEntity({ id: 1, name: 'home', internal_id: 'secret' });
 * console.log(icon.name); // 'home' (camelCase)
 * console.log(icon.internalId); // undefined (hidden)
 * Object.isFrozen(icon); // true
 *
 * @example
 * // Entity with related entities (lazy-loaded to avoid circular deps)
 * const IconEntity = createEntityFromModel(IconModel, {
 *   // Extra methods
 *   isPublished() {
 *     return this.isActive && !this.isDeleted;
 *   }
 * }, {
 *   hiddenFields: ['secretKey'],
 *   relatedEntities: {
 *     set: () => require('./SetEntity'),      // Lazy load
 *     images: () => require('./ImageEntity')
 *   }
 * });
 *
 * const iconData = {
 *   id: 1,
 *   name: 'home',
 *   set: { id: 10, name: 'Material' },
 *   images: [{ id: 100, url: '/img.png' }]
 * };
 *
 * const icon = new IconEntity(iconData);
 * console.log(icon.set instanceof SetEntity); // true
 * console.log(icon.images[0] instanceof ImageEntity); // true
 * console.log(icon.isPublished()); // true (custom method)
 *
 * @example
 * // Entity with allowedColumns (whitelist)
 * const PublicIconEntity = createEntityFromModel(IconModel, {}, {
 *   allowedColumns: ['id', 'name', 'svgPath', 'isActive']
 *   // Only these fields will be included, all others dropped
 * });
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
 * @param {function(string):string} fn
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