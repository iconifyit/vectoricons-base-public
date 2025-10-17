/* eslint-env node */

/**
 * @module Core Infrastructure
 * @fileoverview BaseService - Business Logic Layer with Mixin Composition
 *
 * This is the heart of the Service-Oriented Architecture. BaseService provides:
 * - Consistent CRUD API across all domain services
 * - Automatic cross-cutting concerns via mixins (observability, caching, etc.)
 * - Transaction support
 * - Entity/POJO normalization
 * - Graph (relation) query support
 *
 * **Architecture - The 3-Layer Pattern:**
 * ```
 * HTTP Layer (API routes, schemas)
 *      ↓
 * Service Layer (business logic) ← YOU ARE HERE
 *      ↓
 * Repository Layer (data access)
 *      ↓
 * Database (PostgreSQL)
 * ```
 *
 * **Mixin Composition Pattern:**
 * BaseService is actually `RawBaseService` wrapped with mixins. Each mixin adds
 * functionality without modifying the base class:
 *
 * ```javascript
 * // This file exports:
 * const BaseService = withObservable(RawBaseService);
 *
 * // In production, the full composition would be:
 * const BaseService =
 *   withObservable(      // Automatic timing, metrics, logging
 *   withCacheable(       // Read-through cache with entity rehydration
 *   withPluggable(       // Event-driven plugins
 *   withAccessControl(   // RBAC enforcement
 *   withSoftDeletable(   // Soft delete support
 *   withActivatable(     // Activation state management
 *     RawBaseService     // Core CRUD operations
 *   ))))));
 * ```
 *
 * **Why Mixins?**
 * - **Composable**: Pick which concerns each service needs
 * - **Testable**: Test each concern independently
 * - **No Fragile Base Class**: Avoid deep inheritance hierarchies
 * - **Opt-In**: Services choose their mixins
 *
 * **Usage Pattern:**
 * ```javascript
 * class IconService extends BaseService {
 *   constructor(opts = {}) {
 *     super({
 *       repository: new IconRepository(),
 *       entityClass: IconEntity,
 *       ...opts
 *     });
 *   }
 *
 *   // Custom business logic
 *   async publishIcon(iconId, opts = {}) {
 *     const icon = await this.getById(iconId, opts);
 *     if (!icon) throw new Error('Icon not found');
 *
 *     // Validate business rules
 *     if (!icon.svgPath) throw new Error('Icon has no SVG');
 *
 *     // Update with automatic observability, caching, events
 *     return this.update(iconId, { isActive: true }, opts);
 *   }
 * }
 * ```
 *
 * **What You Get Automatically:**
 * - ✅ Timing/logging for all operations (via withObservable)
 * - ✅ Metrics collection (operation duration, success/failure)
 * - ✅ Event emission for monitoring
 * - ✅ Consistent error handling
 * - ✅ Transaction support
 *
 * @see {@link BaseRepository} For data access layer
 * @see {@link BaseEntity} For entity layer
 */

const { withObservable } = require('./mixins/service');

/**
 * Raw base service class before mixin wrapping.
 *
 * Provides core CRUD operations and delegates to repository layer. This class
 * is wrapped by mixins before export (see bottom of file).
 *
 * **Key Responsibilities:**
 * - Normalize inputs (Entity → POJO) before passing to repository
 * - Provide consistent CRUD interface
 * - Handle graph queries (eager loading)
 * - Support pagination (offset-based, cursor pending)
 * - Transaction passthrough
 *
 * **Does NOT Handle** (delegated to mixins/repositories):
 * - Caching (use withCacheable mixin)
 * - Observability (use withObservable mixin)
 * - Access control (use withAccessControl mixin)
 * - Event emission (use withPluggable mixin)
 * - Soft deletes (use withSoftDeletable mixin)
 *
 * @class RawBaseService
 * @private
 */
class RawBaseService  {
    /**
     * Create a service instance.
     * @param {Object} options
     * @param {Object} options.repository
     * @param {Function} options.entityClass
     */
    constructor({ repository, entityClass }) {
        if (!repository || !entityClass) {
            throw new Error('BaseService requires both a repository and an entityClass');
        }
        this.repository = repository;
        this.entityClass = entityClass;
    }

    /**
     * Determine whether a value looks like one of our Entity instances.
     * Uses presence of toJSON, hiddenFields marker, or class name suffix.
     * @param {*} val
     * @returns {boolean}
     */
    isEntity(val) {
        if (!val || typeof val !== 'object') {
            return false;
        }
        const hasToJSON = typeof val.toJSON === 'function';
        const hasHiddenFields = Array.isArray(val.hiddenFields);
        const nameLooksLikeEntity = typeof val.constructor?.name === 'string'
            ? val.constructor.name.endsWith('Entity')
            : false;
        return hasToJSON || hasHiddenFields || nameLooksLikeEntity;
    }

    /**
     * Get the default graph name for expanded queries.
     * Override in subclasses to provide a different default.
     * @returns {string} Default graph name.
     */
    getDefaultGraphName() {
        return 'default';
    }

    /**
     * Get the graph expression for a named graph.
     * Override in subclasses to provide named graphs.
     * @param {string} name - Name of the graph.
     * @returns {string} Graph expression.
     */
    getGraphExpression(name) {
        return '';
    }

    /**
     * Get the graph modifiers for a named graph.
     * Override in subclasses to provide named graph modifiers.
     * @param {string} name - Name of the graph.
     * @returns {Object<string,Function>|undefined} Graph modifiers.
     */
    getGraphModifiers(name) {
        return undefined;
    }

    /**
     * Get a single record matching a where clause, including related data.
     * Returns an Entity instance or null.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {string} [opts.graphName] - Name of the graph to use.
     * @param {boolean} [opts.includeHiddenFields=false] - Whether to include hidden fields.
     * @param {Object} [opts.trx] - Knex transaction.
     * @returns {Promise<*>} Entity instance or null
     */
    async getOneExpanded(where = {}, { graphName = this.getDefaultGraphName(), includeHiddenFields = false, trx } = {}) {
        const graph = this.getGraphExpression(graphName);
        const modifiers = this.getGraphModifiers(graphName);
        return this.repository.findOneWithRelations(where, graph, {
            entityClass: this.entityClass,
            entityOptions: { includeHiddenFields },
            trx,
            modifiers,
        });
    }

    /**
     * Get records matching a where clause, including related data.
     * Returns an array of Entity instances.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {string} [opts.graphName] - Name of the graph to use.
     * @param {boolean} [opts.includeHiddenFields=false] - Whether to include hidden fields.
     * @param {Object} [opts.trx] - Knex transaction.
     * @returns {Promise<Array<*>>} Array of Entity instances
     */
    async getWhereExpanded(where = {}, { graphName = this.getDefaultGraphName(), includeHiddenFields = false, trx } = {}) {
        const graph = this.getGraphExpression(graphName);
        const modifiers = this.getGraphModifiers(graphName);
        return this.repository.withRelations(where, graph, {
            entityClass: this.entityClass,
            entityOptions: { includeHiddenFields },
            trx,
            modifiers,
        });
    }

    /**
     * Convert an Entity to a POJO using toJSON, otherwise return the value unchanged.
     * Dates inside entity.toJSON() are expected to be serialized consistently.
     * @param {*} val
     * @returns {*}
     */
    toPlain(val) {
        return this.isEntity(val) ? val.toJSON() : val;
    }

    /**
     * Get a single record matching a where clause.
     * Returns an Entity instance or null.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    // async getOne(where = {}, { trx } = {}) {
    //     return await this.repository.findOne(where, { entityClass: this.entityClass, trx });
    // }
    async getOne(where = {}, { trx, includeHiddenFields = false } = {}) {
        return this.repository.findOne(where, {
            entityClass    : this.entityClass,
            entityOptions  : { includeHiddenFields },
            trx
        });
    }


    /**
     * Get a single record matching a where clause, including related data.
     * Returns an Entity instance or null.
     * @param {Object} where
     * @param {string} graph
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     * @returns {Promise<*>} Entity instance or null
     * @example
     *   const user = await userService.getOneWithRelations(
     *     { id: 1 },
     *     'account, roles',
     *     { trx }
     *   );
     *   console.log(user.account, user.roles);
     */
    async getOneWithRelations(where = {}, graph = '', { trx, modifiers, includeHiddenFields = false } = {}) {
        const result = await this.repository.findOneWithRelations(where, graph, {
            entityClass    : this.entityClass,
            entityOptions  : { includeHiddenFields },
            trx,
            modifiers
        });
        return result;
    }

    /**
     * Get records matching a where clause, including related data.
     * Returns an array of Entity instances.
     * @param {Object} where
     * @param {string} graph
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     * @returns {Promise<Array<*>>} Array of Entity instances
     * @example
     *   const users = await userService.getWhereWithRelations(
     *     { isActive: true },
     *     'account, roles',
     *     { trx }
     *   );
     *   console.log(users[0].account, users[0].roles);
     */
    async getWhereWithRelations(where = {}, graph = '', { trx, modifiers, includeHiddenFields = false } = {}) {
        return this.repository.withRelations(where, graph, {
            entityClass    : this.entityClass,
            entityOptions  : { includeHiddenFields },
            trx,
            modifiers
        });
    }

    /**
     * Paginate records using the repository's offset/limit paging.
     * Returns { results, total, page, pageSize, totalPages } with results as Entities.
     * @param {Object} where
     * @param {number} page          1-based page number
     * @param {number} pageSize
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    // async paginate(where = {}, page = 1, pageSize = 10, { trx } = {}) {
    //     return await this.repository.paginate(where, page, pageSize, {
    //         entityClass: this.entityClass,
    //         trx,
    //     });
    // }
    async paginate(where = {}, page = 1, pageSize = 10, { trx, includeHiddenFields = false } = {}) {
        return this.repository.paginate(where, page, pageSize, {
            entityClass    : this.entityClass,
            entityOptions  : { includeHiddenFields },
            trx
        });
    }

    /**
     * Get all records.
     * Returns an array of Entity instances.
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async getAll({ trx } = {}) {
        return await this.repository.findAll({}, { entityClass: this.entityClass, trx });
    }

    /**
     * !IMPORTANT: This method returns a maximum of 1000 records as a sanity check. 
     * If you need more, use paginate function instead.
     * Get records matching a where clause.
     * Returns an array of Entity instances.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    // async getWhere(where = {}, { trx } = {}) {
    //     const { results } = await this.paginate(where, 1, 1000, { trx });
    //     return results;
    // }
    async getWhere(where = {}, { trx, includeHiddenFields = false } = {}) {
        const { results } = await this.paginate(where, 1, 1000, { trx, includeHiddenFields });
        return results;
    }
 
    /**
     * Get a record by its ID.
     * Returns an Entity instance or null.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    // async getById(id, { trx } = {}) {
    //     return await this.repository.findById(id, { entityClass: this.entityClass, trx });
    // }
    async getById(id, { trx, includeHiddenFields = false } = {}) {
        return this.repository.findById(id, {
            entityClass    : this.entityClass,
            entityOptions  : { includeHiddenFields },
            trx
        });
    }

    /**
     * Create a record.
     * Accepts either a POJO or an Entity instance.
     * @param {Object} data
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async create(data, { trx } = {}) {
        return await this.repository.create(this.toPlain(data), { trx });
    }

    /**
     * Update a record by its ID.
     * Accepts either a POJO or an Entity instance for the update data.
     * @param {string|number} id
     * @param {Object} data
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async update(id, data, { trx } = {}) {
        return await this.repository.update(id, this.toPlain(data), { trx });
    }

    /**
     * Delete a record by its ID.
     * Returns the number of rows deleted.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async delete(id, { trx } = {}) {
        return await this.repository.delete(id, { trx });
    }

    /**
     * Soft delete a record by its ID.
     * Marks the record inactive and deleted.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    // TODO: softDelete is implemented via mixin now, so this is commented out to avoid confusion.
    // async softDelete(id, { trx } = {}) {
    //     return await this.repository.update(id, { is_active: false, is_deleted: true }, { trx });
    // }

    /**
     * Upsert a record based on a where clause.
     * Accepts either a POJO or an Entity instance.
     * @param {Object} data
     * @param {Object} [whereClause={}]
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async upsert(data, whereClause = {}, { trx } = {}) {
        return await this.repository.upsert(this.toPlain(data), whereClause, { trx });
    }

    /**
     * Check if a record exists for a where clause.
     * Returns true or false.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async exists(where = {}, { trx } = {}) {
        return this.repository.exists(where, { trx });
    }

    /**
     * Assert that at least one record exists for a where clause.
     * Throws an error if not found.
     * @param {Object} where
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async assertExists(where = {}, { trx } = {}) {
        const found = await this.getOne(where, { trx });
        if (!found) {
            throw new Error(`${this.entityClass.name} not found`, JSON.stringify(where, null, 2));
        }
        return found;
    }

    /**
     * Get active records, optionally filtered by additional WHERE criteria.
     * Returns an array of Entity instances.
     * @param {Object} [where={}] - Additional WHERE clause to filter results
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async getActive(where = {}, { trx } = {}) {
        const fullWhere = { ...where, is_active: true };

        // Only add is_deleted filter if the model has that column
        const modelSchema = this.repository.model.jsonSchema;
        if (modelSchema && modelSchema.properties && modelSchema.properties.is_deleted) {
            fullWhere.is_deleted = false;
        }

        return this.repository.findAll(
            fullWhere,
            { entityClass: this.entityClass, trx }
        );
    }

    /**
     * Activate a record by its ID.
     * Throws if not found.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async activate(id, { trx } = {}) {
        const record = await this.getById(id, { trx });
        if (!record) {
            throw new Error(`${this.entityClass.name} with ID ${id} not found`);
        }

        const updateData = { is_active: true };

        // Only set is_deleted if the model has that column
        const modelSchema = this.repository.model.jsonSchema;
        if (modelSchema && modelSchema.properties && modelSchema.properties.is_deleted) {
            updateData.is_deleted = false;
        }

        return this.repository.update(id, updateData, { trx });
    }

    /**
     * Deactivate a record by its ID.
     * Throws if not found.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async deactivate(id, { trx } = {}) {
        const record = await this.getById(id, { trx });
        if (!record) {
            throw new Error(`${this.entityClass.name} with ID ${id} not found`);
        }

        const updateData = { is_active: false };

        // Only set is_deleted if the model has that column
        const modelSchema = this.repository.model.jsonSchema;
        if (modelSchema && modelSchema.properties && modelSchema.properties.is_deleted) {
            updateData.is_deleted = false;
        }

        return this.repository.update(id, updateData, { trx });
    }

    /**
     * Toggle the active status of a record by its ID.
     * Throws if not found.
     * @param {string|number} id
     * @param {Object} [opts]
     * @param {Object} [opts.trx]
     */
    async toggleActive(id, { trx } = {}) {
        const record = await this.repository.findById(id, { entityClass: this.entityClass, trx });
        if (! record) {
            throw new Error(`${this.entityClass.name} with id ${id} not found`);
        }
        return this.repository.update(id, { is_active: !record.isActive }, { trx });
    }

    /**
     * Cursor-based pagination passthrough.
     * Defers to repository.cursorPage where the actual implementation will live.
     * Returns { results, nextCursor, prevCursor } when implemented in repository.
     * @param {Object} where
     * @param {Array} order
     * @param {Object} opts
     * @param {number} [opts.limit=20]
     * @param {string|null} [opts.cursor=null]
     * @param {Object} [opts.trx]
     */
    async cursorPage(where = {}, order = [], { limit = 20, cursor = null, trx } = {}) {
        return this.repository.cursorPage(where, order, { limit, cursor, trx });
    }
}

/**
 * Export BaseService with observability mixin applied.
 *
 * This demonstrates the mixin composition pattern. RawBaseService provides
 * core CRUD operations, while withObservable wraps it to add automatic:
 * - Timing (operation duration tracking)
 * - Logging (structured logs for all operations)
 * - Metrics (success/failure counts, duration stats)
 * - Event emission (observability.service events)
 *
 * **How Mixins Work:**
 * withObservable() is a higher-order function that:
 * 1. Takes a service class (RawBaseService)
 * 2. Returns a new class that extends it
 * 3. Wraps key methods (getById, create, update, etc.)
 * 4. Adds pre/post hooks for timing and logging
 * 5. Emits events for monitoring
 *
 * **What This Means for Your Code:**
 * ```javascript
 * const iconService = new IconService();
 * const icon = await iconService.getById(123);
 *
 * // Automatically logged:
 * // "icon-service.getById success 45ms { id: 123 }"
 *
 * // Automatically emitted:
 * // Event: observability.service
 * //   { service: 'icon', operation: 'getById', phase: 'success', durationMs: 45 }
 *
 * // Automatically tracked:
 * // Metric: operation_duration_ms=45 operation=getById service=icon result=success
 * ```
 *
 * **In Production:**
 * The full composition would include more mixins:
 * ```javascript
 * const BaseService =
 *   withObservable(
 *   withCacheable(
 *   withPluggable(
 *   withAccessControl(
 *   withSoftDeletable(
 *   withActivatable(
 *     RawBaseService
 *   ))))));
 * ```
 *
 * @type {typeof RawBaseService}
 * @see {@link withObservable} For observability mixin documentation
 */
const BaseService = withObservable(RawBaseService);

module.exports = BaseService;