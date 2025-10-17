"use strict";

/**
 * BaseRepository class for managing database operations
 * @class BaseRepository
 * @description This class provides a base for repository classes to interact with the database.
 * It includes methods for CRUD operations, pagination, and entity wrapping.
 * @param {Object} options - Options for the repository
 * @param {Object} options.DB - Database instance (default: require('@vectoricons.net/db'))
 * @param {String} options.modelName - Name of the model in the DB instance
 * @param {Function} options.entityClass - Entity class to wrap results in (optional)
 * @param {Object} options.hooks - Hooks to apply to results (optional)
 * @param {boolean} options.freezeEntities - Freeze returned entities (default: true)
 * @param {boolean} options.deepFreezeEntities - Deep-freeze returned entities (default: true)
 * @throws {Error} - If required parameters are missing or invalid
 */

// ---- immutability utilities ----
const deepFreeze = (value, seen = new WeakSet()) => {
    if (value == null || typeof value !== 'object' || seen.has(value)) return value;

    seen.add(value);

    if (Array.isArray(value)) {
        value.forEach((item) => deepFreeze(item, seen));
    } else {
        Object.getOwnPropertyNames(value).forEach((key) => {
            const v = value[key];
            if (v && typeof v === 'object') deepFreeze(v, seen);
        });
    }

    return Object.freeze(value);
};

class BaseRepository {
    constructor({
        DB = require('@vectoricons.net/db'),
        modelName,
        entityClass = this.entityClass,
        hooks = {},
        freezeEntities = true,
        deepFreezeEntities = true,
    } = {}) {
        if (!DB) {
            throw new Error('BaseRepository requires a DB instance');
        }

        if (!modelName) {
            throw new Error('BaseRepository requires a model name');
        }

        if (!DB[modelName]) {
            throw new Error('BaseRepository requires a model (Objection class)');
        }

        if (!entityClass) {
            throw new Error('BaseRepository requires an entity class');
        }

        this.DB = DB;
        this.modelName = modelName;
        this.model = DB[modelName];
        this.entityClass = entityClass;
        this.hooks = hooks;

        this.freezeEntities = freezeEntities;
        this.deepFreezeEntities = deepFreezeEntities;
    }

    /**
     * Applies a hook to the given value
     * @param {String} name - The name of the hook to apply
     * @param {Object|Array} value - The value to apply the hook to
     * @returns {Promise<Object|Array>} - The value after applying the hook
     */
    async applyHook(name, value) {
        const hook = this.hooks?.[name];
        if (!hook) return value;

        if (Array.isArray(value)) {
            if (name === 'afterList') {
                const result = await hook(value);
                return result ?? value;
            }
            const mapped = await Promise.all(value.map(item => hook(item)));
            return mapped;
        }

        const result = await hook(value);
        return result ?? value;
    }

    // Finalize: optional hook + freezing policy
    async finalize(value, hookName = null) {
        const hooked = hookName ? await this.applyHook(hookName, value) : value;

        if (!this.freezeEntities) return hooked;

        if (!this.deepFreezeEntities) {
            return Array.isArray(hooked)
                ? Object.freeze(hooked.slice())
                : Object.freeze(hooked);
        }

        return deepFreeze(hooked);
    }

    /**
     * Wraps the result in an entity class if provided.
     * Supports nested entity wrapping via the Entity factory (createEntityFromModel).
     *
     * @param {Object|Array} result
     * @param {Function} entityClass
     * @param {Object} [entityOptions={}]
     * @returns {Object|Array}
     */
    wrapEntity(result, entityClass, entityOptions = {}) {
        if (!entityClass) return result;

        const wrapSingle = (record) => {
            if (!record || typeof record !== 'object') return record;

            const plain = typeof record.toJSON === 'function' ? record.toJSON() : { ...record };

            const instance = typeof entityClass.from === 'function'
                ? entityClass.from(plain)
                : new entityClass(plain, entityOptions);

            return instance;
        };

        return Array.isArray(result) ? result.map(wrapSingle) : wrapSingle(result);
    }

    /**
     * Finds a record by its ID
     */
    async findById(id, { entityClass = this.entityClass, entityOptions = {}, trx } = {}) {
        const record = await this.model.query(trx).findById(id);
        const entity = this.wrapEntity(record, entityClass, entityOptions);
        return this.finalize(entity, 'afterFind');
    }

    /**
     * Finds a record matching a where clause
     */
    async findOne(where = {}, { entityClass = this.entityClass, entityOptions = {}, trx } = {}) {
        const record = await this.model.query(trx).findOne(where);
        const entity = this.wrapEntity(record, entityClass, entityOptions);
        return this.finalize(entity, 'afterFind');
    }

    /**
     * Finds all records that match the given criteria
     */
    async findAll(where = {}, { entityClass = this.entityClass, entityOptions = {}, trx } = {}) {
        const query = this.model.query(trx);
        if (Object.keys(where).length > 0) {
            query.where(where);
        }
        const records = await query;
        const entities = this.wrapEntity(records, entityClass, entityOptions);
        return this.finalize(entities, 'afterList');
    }

    /**
     * Finds records by their IDs
     */
    async findByIds(ids = [], { entityClass = this.entityClass, entityOptions = {}, trx } = {}) {
        const records = await this.model.query(trx).findByIds(ids);
        const entities = this.wrapEntity(records, entityClass, entityOptions);
        return this.finalize(entities, 'afterList');
    }

    /**
     * Paginates results
     */
    async paginate(where = {}, page = 1, pageSize = 10, { entityClass = this.entityClass, entityOptions = {}, trx } = {}) {
        const offsetPage = Math.max(page - 1, 0);
        const { results, total } = await this.model.query(trx).where(where).page(offsetPage, pageSize);
        const entities = this.wrapEntity(results, entityClass, entityOptions);
        const frozenResults = await this.finalize(entities, 'afterList');
        const pageObj = { results: frozenResults, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
        return this.freezeEntities ? deepFreeze(pageObj) : pageObj;
    }

    /**
     * Cursor-based pagination (stub).
     */
    async cursorPage(where = {}, order = [], { limit = 20, cursor = null, trx } = {}) {
        throw new Error('BaseRepository.cursorPage is not implemented yet. TODO: Implement cursor-based pagination.');
    }

    /**
     * Creates a new record
     */
    async create(data, { trx } = {}) {
        const rec = await this.model.query(trx).insert(data).returning('*');
        const entity = this.wrapEntity(rec, this.entityClass);
        return this.finalize(entity, null);
    }

    /**
     * Creates multiple records
     */
    async createMany(records = [], { trx } = {}) {
        return await this.model.query(trx).insert(records);
    }

    /**
     * Upserts a record (insert or update)
     */
    async upsert(data, whereClause = {}, { trx } = {}) {
        const where = Object.keys(whereClause).length > 0
            ? whereClause
            : data.id ? { id: data.id } : null;

        if (!where) {
            throw new Error('Upsert requires either `id` in data or a `whereClause`');
        }

        const existing = await this.model.query(trx).findOne(where);
        if (existing) {
            const requiredFields = this.model.jsonSchema?.required ?? [];
            const nullViolations = requiredFields.filter(
                (key) => Object.prototype.hasOwnProperty.call(data, key) && data[key] === null
            );
            if (nullViolations.length > 0) {
                throw new Error(`Cannot set required field(s) to null: ${nullViolations.join(', ')}`);
            }

            await this.model.query(trx)
                .context({ skipValidation: true })
                .findById(existing.id)
                .patch(data);

            const updatedRecord = await this.model.query(trx).findById(existing.id);
            const entity = this.wrapEntity(updatedRecord, this.entityClass);
            return this.finalize(entity, null);
        }

        const inserted = await this.model.query(trx).insert(data);
        const entity = this.wrapEntity(inserted, this.entityClass);
        return this.finalize(entity, null);
    }

    /**
     * Updates a record by its ID
     * NOTE: mirrors your existing behavior (returns patch result wrapped).
     */
    async update(id, data, { trx } = {}) {
        const rec = await this.model.query(trx).findById(id).patch(data);
        const entity = this.wrapEntity(rec, this.entityClass);
        return this.finalize(entity, null);
    }

    /**
     * Updates records that match the given criteria
     */
    async updateWhere(where = {}, data, { trx } = {}) {
        return await this.model.query(trx).where(where).patch(data);
    }

    /**
     * Deletes a record by its ID
     */
    async delete(id, { trx } = {}) {
        return await this.model.query(trx).deleteById(id);
    }

    /**
     * Deletes records that match the given criteria
     */
    async deleteWhere(where = {}, { trx } = {}) {
        return await this.model.query(trx).where(where).delete();
    }

    /**
     * Checks if a record exists that matches the given criteria
     */
    async exists(where = {}, { trx } = {}) {
        const result = await this.model.query(trx).findOne(where);
        return !!result;
    }

    /**
     * Counts the number of records that match the given criteria
     */
    async count(where = {}, { trx } = {}) {
        const result = await this.model.query(trx).where(where).count().first();
        return parseInt(result.count, 10);
    }

    /** 
     * Finds records with related data (no afterList hook to avoid relation mutations)
     */
    async withRelations(
        where = {},
        graph = '',
        { entityClass = this.entityClass, entityOptions = {}, trx, modifiers } = {}
    ) {
        let queryBuilder = this.model.query(trx);
        if (Object.keys(where).length) queryBuilder = queryBuilder.where(where);
        if (graph) queryBuilder = queryBuilder.withGraphFetched(graph);
        if (modifiers) queryBuilder = queryBuilder.modifiers(modifiers);

        const records = await queryBuilder;
        const entities = this.wrapEntity(records, entityClass, entityOptions);
        return this.finalize(entities, null);
    }

    /** 
     * Finds a single record with related data (no afterFind hook to avoid relation mutations)
     */
    async findOneWithRelations(
        where = {},
        graph = '',
        { entityClass = this.entityClass, entityOptions = {}, trx, modifiers } = {}
    ) {
        let queryBuilder = this.model.query(trx).findOne(where);
        if (graph) queryBuilder = queryBuilder.withGraphFetched(graph);
        if (modifiers) queryBuilder = queryBuilder.modifiers(modifiers);

        const record = await queryBuilder;
        const entity = this.wrapEntity(record, entityClass, entityOptions);
        return this.finalize(entity, null);
    }

    /**
     * Returns a query builder for the model
     */
    query({ trx } = {}) {
        return this.model.query(trx);
    }

    /**
     * Executes a raw SQL query
     */
    raw(sql, bindings = [], { trx } = {}) {
        return this.DB.knex.raw(sql, bindings, { trx });
    }
}

module.exports = BaseRepository;