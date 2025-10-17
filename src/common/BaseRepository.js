"use strict";

/**
 * @module Core Infrastructure
 * @fileoverview BaseRepository - Data Access Layer for SOA architecture.
 *
 * The Repository layer sits between Services and the Database, providing:
 * - CRUD operations with consistent patterns
 * - Entity wrapping (database rows → immutable Entity instances)
 * - Pagination (offset-based, cursor TBD)
 * - Query builder access for custom queries
 * - Transaction support
 * - Hook system for cross-cutting concerns
 * - Immutability enforcement (frozen entities)
 *
 * **Architecture:**
 * ```
 * Service Layer (business logic)
 *      ↓
 * Repository Layer (data access) ← YOU ARE HERE
 *      ↓
 * Objection.js ORM (query building)
 *      ↓
 * PostgreSQL Database
 * ```
 *
 * **Design Pattern:**
 * All repositories extend BaseRepository and provide domain-specific queries:
 *
 * ```javascript
 * class IconRepository extends BaseRepository {
 *   constructor(opts = {}) {
 *     super({
 *       modelName: 'IconModel',
 *       entityClass: IconEntity,
 *       ...opts
 *     });
 *   }
 *
 *   // Custom query methods
 *   async findBySetId(setId) {
 *     return this.model.query().where('set_id', setId);
 *   }
 * }
 * ```
 *
 * **Key Features:**
 * - **Entity Wrapping**: Automatic conversion of DB rows to Entity instances
 * - **Immutability**: All returned entities are frozen (Object.freeze)
 * - **Hooks**: afterFind, afterList for post-processing
 * - **Transactions**: Pass `trx` option to any method
 * - **Related Data**: withRelations() for eager loading
 *
 * @see {@link BaseEntity} For entity layer documentation
 * @see {@link BaseService} For service layer documentation
 */

/**
 * Recursively freeze an object and all nested objects/arrays.
 *
 * Prevents accidental mutations of entities after retrieval from database.
 * Uses WeakSet to handle circular references safely.
 *
 * @private
 * @param {*} value - Value to freeze (object, array, or primitive)
 * @param {WeakSet} [seen=new WeakSet()] - Tracks visited objects to avoid infinite loops
 * @returns {*} Frozen value
 */
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

/**
 * Base repository class providing data access patterns for all domain repositories.
 *
 * Handles the translation between database rows (via Objection.js) and immutable
 * Entity instances. All domain repositories (IconRepository, UserRepository, etc.)
 * extend this class and inherit these CRUD operations.
 *
 * **Responsibilities:**
 * - Execute database queries via Objection.js models
 * - Convert query results to Entity instances
 * - Enforce immutability (freeze entities)
 * - Support transactions
 * - Provide consistent CRUD interface
 *
 * **Does NOT:**
 * - Contain business logic (use Services)
 * - Handle caching (use Services with CacheableService mixin)
 * - Emit events (use Services)
 * - Enforce access control (use Services with AccessControl)
 *
 * @class BaseRepository
 *
 * @example
 * // Define domain repository
 * class IconRepository extends BaseRepository {
 *   constructor(opts = {}) {
 *     super({
 *       modelName: 'IconModel',
 *       entityClass: IconEntity,
 *       hooks: {
 *         afterFind: async (icon) => {
 *           // Post-process icon if needed
 *           return icon;
 *         }
 *       },
 *       ...opts
 *     });
 *   }
 *
 *   // Custom query
 *   async findActiveBySetId(setId) {
 *     const rows = await this.model.query()
 *       .where({ set_id: setId, is_active: true })
 *       .orderBy('name');
 *     return this.wrapEntity(rows, this.entityClass);
 *   }
 * }
 *
 * @example
 * // Use in service
 * const repository = new IconRepository();
 * const icon = await repository.findById(123);
 * console.log(icon instanceof IconEntity); // true
 * console.log(Object.isFrozen(icon)); // true
 */
class BaseRepository {
    /**
     * Construct repository with model and entity bindings.
     *
     * @param {Object} options - Repository configuration
     * @param {Object} [options.DB] - Database instance (default: require('@vectoricons.net/db'))
     * @param {string} options.modelName - Name of Objection model in DB instance (e.g., 'IconModel')
     * @param {Function} options.entityClass - Entity class to wrap results (e.g., IconEntity)
     * @param {Object} [options.hooks={}] - Lifecycle hooks (afterFind, afterList)
     * @param {Function} [options.hooks.afterFind] - Called after findById/findOne
     * @param {Function} [options.hooks.afterList] - Called after findAll/paginate
     * @param {boolean} [options.freezeEntities=true] - Whether to freeze returned entities
     * @param {boolean} [options.deepFreezeEntities=true] - Whether to deep-freeze (recursive)
     *
     * @throws {Error} If DB instance is missing
     * @throws {Error} If modelName is missing
     * @throws {Error} If model doesn't exist in DB instance
     * @throws {Error} If entityClass is missing
     *
     * @example
     * const repo = new IconRepository({
     *   modelName: 'IconModel',
     *   entityClass: IconEntity,
     *   hooks: {
     *     afterList: async (icons) => {
     *       console.log(`Loaded ${icons.length} icons`);
     *       return icons;
     *     }
     *   }
     * });
     */
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
     * Convert database rows to Entity instances.
     *
     * This is the core method that transforms plain database objects (from Objection.js)
     * into immutable, frozen Entity instances. Handles both single objects and arrays.
     *
     * **Entity Wrapping Process:**
     * 1. Convert Objection model instance to plain object (via toJSON if available)
     * 2. Pass to Entity constructor
     * 3. Entity filters hidden fields, materializes relations
     * 4. Returns frozen, immutable Entity instance
     *
     * @param {Object|Array<Object>} result - Database row(s) from Objection query
     * @param {Function} entityClass - Entity class to instantiate (e.g., IconEntity)
     * @param {Object} [entityOptions={}] - Options passed to Entity constructor
     * @param {boolean} [entityOptions.includeHiddenFields] - Include hidden fields
     * @returns {Object|Array<Object>} Entity instance(s)
     *
     * @example
     * // Single entity
     * const row = await IconModel.query().findById(1);
     * const icon = this.wrapEntity(row, IconEntity);
     * console.log(icon instanceof IconEntity); // true
     *
     * @example
     * // Array of entities
     * const rows = await IconModel.query().where({ is_active: true });
     * const icons = this.wrapEntity(rows, IconEntity);
     * console.log(icons[0] instanceof IconEntity); // true
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
     * Paginate query results with offset-based pagination.
     *
     * Returns paginated results with metadata (total count, page info). Uses Objection's
     * .page() method which efficiently counts total rows and fetches the requested page.
     *
     * **Note:** Offset pagination doesn't scale well beyond ~100K rows. For large datasets,
     * consider cursor-based pagination (currently not implemented).
     *
     * @param {Object} [where={}] - WHERE clause conditions
     * @param {number} [page=1] - Page number (1-indexed)
     * @param {number} [pageSize=10] - Items per page
     * @param {Object} [options={}] - Query options
     * @param {Function} [options.entityClass] - Entity class override
     * @param {Object} [options.entityOptions] - Entity constructor options
     * @param {Object} [options.trx] - Knex transaction object
     * @returns {Promise<Object>} Pagination result:
     *   - results: Array of Entity instances
     *   - total: Total row count
     *   - page: Current page (1-indexed)
     *   - pageSize: Items per page
     *   - totalPages: Total page count
     *
     * @example
     * const result = await iconRepo.paginate(
     *   { is_active: true },
     *   1,  // page
     *   20  // pageSize
     * );
     * console.log(result.results.length); // 20
     * console.log(result.total); // 150000
     * console.log(result.totalPages); // 7500
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