/**
 * @module Cursor Pagination
 * @fileoverview withCursorPagination - Mixin for cursor-based pagination in repositories.
 *
 * Adds efficient keyset pagination to repositories, solving the performance issues
 * of offset/limit pagination at scale. Works with complex filters, sorts, and search facets.
 *
 * **Problem with Offset Pagination:**
 * ```sql
 * SELECT * FROM icons WHERE price = 0 OFFSET 10000 LIMIT 20;
 * -- Must scan 10,000 rows to skip them! O(n) complexity
 * ```
 *
 * **Solution with Cursor Pagination:**
 * ```sql
 * SELECT * FROM icons
 * WHERE (created_at, id) < ($1, $2)  -- Last seen values
 * ORDER BY created_at DESC, id DESC
 * LIMIT 20;
 * -- Uses index! O(log n) complexity
 * ```
 *
 * **Key Features:**
 * - Keyset pagination (WHERE clause, not OFFSET)
 * - Supports multi-field sorting (created_at + id for uniqueness)
 * - Supports array position sorting (for Elasticsearch relevance)
 * - Works with all filters/facets (price, tags, search, etc.)
 * - Returns cursor metadata (hasNextPage, hasPrevPage)
 * - Handles forward and backward pagination
 * - Consistent results even when data changes
 *
 * **Architecture Integration:**
 * ```
 * HTTP Layer (route handlers)
 *      ↓ ?cursor=abc123&limit=20
 * Service Layer
 *      ↓ cursorPaginate({ filters }, cursor, limit)
 * Repository Layer (with withCursorPagination) ← YOU ARE HERE
 *      ↓ Build keyset query
 * Database (uses index, fast!)
 * ```
 *
 * @example
 * // Apply mixin to repository
 * const IconRepository = withCursorPagination(BaseIconRepository);
 *
 * @example
 * // Use cursor pagination (field-based sorting)
 * const result = await iconRepo.cursorPaginate({
 *   filters: {
 *     price: 'free',
 *     tagIds: [1, 2, 3],
 *     styleId: 5
 *   },
 *   cursor: 'eyJpZCI6MTIzNDUsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTUifQ==',
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 *
 * @example
 * // Use cursor pagination (array position sorting for Elasticsearch)
 * const esRankedIds = [1001, 2003, 5005, 3002]; // From Elasticsearch
 * const result = await iconRepo.cursorPaginate({
 *   filters: {
 *     iconIdsOrder: esRankedIds,  // ES ranked IDs
 *     price: 'free'
 *   },
 *   cursor: null,
 *   limit: 20,
 *   sortBy: 'relevance',  // Special: use array position
 *   sortOrder: 'asc'
 * });
 *
 * // Returns:
 * {
 *   results: [Icon, Icon, Icon],  // Entity instances
 *   pageInfo: {
 *     hasNextPage: true,
 *     hasPreviousPage: false,
 *     startCursor: 'eyJpZCI6MTAwMX0=',
 *     endCursor: 'eyJpZCI6MTAyMH0=',
 *     totalCount: 1500  // Optional, expensive
 *   }
 * }
 */

const { CursorEncoder } = require('../../cursor');

/**
 * Mixin to add cursor pagination to a repository class.
 *
 * Adds `cursorPaginate()` method that implements keyset pagination with:
 * - Multi-field sort support (e.g., created_at DESC, id DESC)
 * - Filter application before cursor (search facets)
 * - Cursor encoding/decoding
 * - Metadata (hasNext, hasPrev, cursors)
 * - Forward and backward paging
 *
 * **Method Added:**
 * ```javascript
 * async cursorPaginate(options)
 * ```
 *
 * **Options:**
 * - `filters` - Object with filter criteria (price, tagIds, styleId, etc.)
 * - `cursor` - Encoded cursor token from previous page
 * - `limit` - Page size (default: 20, max: 100)
 * - `sortBy` - Field to sort by (default: 'createdAt')
 * - `sortOrder` - 'asc' or 'desc' (default: 'desc')
 * - `includeTotalCount` - Whether to count total matches (expensive!)
 * - `entityClass` - Entity class for results
 * - `entityOptions` - Options for entity construction
 * - `trx` - Knex transaction
 *
 * **Performance:**
 * - First page (no cursor): O(log n + limit)
 * - Subsequent pages (with cursor): O(log n + limit)
 * - Total count (if requested): O(n) - use sparingly!
 *
 * @param {Function} BaseClass - Repository class to extend
 * @returns {Function} Enhanced repository class with cursor pagination
 *
 * @example
 * // Create repository with cursor pagination
 * class RawIconRepository {
 *   constructor(opts) {
 *     this.model = IconModel;
 *   }
 * }
 *
 * const IconRepository = withCursorPagination(RawIconRepository);
 *
 * @example
 * // Use in service
 * const result = await iconRepo.cursorPaginate({
 *   filters: {
 *     price: 'free',
 *     tagIds: [1, 2, 3]
 *   },
 *   cursor: null,  // First page
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 */
const withCursorPagination = (BaseClass) => {
    return class extends BaseClass {
        /**
         * Paginate using cursor-based keyset pagination.
         *
         * Builds a query with:
         * 1. Apply all filters FIRST (WHERE clauses)
         * 2. Apply cursor condition (keyset WHERE)
         * 3. Sort by specified fields + id for uniqueness
         * 4. Limit results
         * 5. Generate cursors for next/prev pages
         *
         * **Keyset Condition:**
         * For `sortBy='createdAt', sortOrder='desc'`:
         * ```sql
         * WHERE (created_at, id) < (cursor.createdAt, cursor.id)
         * ```
         *
         * This uses a composite index and is O(log n) instead of O(n) like OFFSET.
         *
         * @async
         * @param {Object} options - Pagination options
         * @param {Object} [options.filters={}] - Filter criteria
         * @param {string} [options.cursor=null] - Cursor token from previous page
         * @param {number} [options.limit=20] - Page size (max 100)
         * @param {string} [options.sortBy='createdAt'] - Field to sort by
         * @param {string} [options.sortOrder='desc'] - 'asc' or 'desc'
         * @param {boolean} [options.includeTotalCount=false] - Whether to count total (expensive!)
         * @param {Function} [options.entityClass] - Entity class for results
         * @param {Object} [options.entityOptions={}] - Entity construction options
         * @param {Object} [options.trx] - Knex transaction
         *
         * @returns {Promise<Object>} Pagination result
         * @returns {Array} result.results - Entity instances for current page
         * @returns {Object} result.pageInfo - Pagination metadata
         * @returns {boolean} result.pageInfo.hasNextPage - True if more results exist
         * @returns {boolean} result.pageInfo.hasPreviousPage - True if previous page exists
         * @returns {string|null} result.pageInfo.startCursor - Cursor for first item
         * @returns {string|null} result.pageInfo.endCursor - Cursor for last item
         * @returns {number} [result.pageInfo.totalCount] - Total count (if includeTotalCount=true)
         *
         * @example
         * // First page (newest icons)
         * const page1 = await repo.cursorPaginate({
         *   filters: { price: 'free' },
         *   cursor: null,
         *   limit: 20,
         *   sortBy: 'createdAt',
         *   sortOrder: 'desc'
         * });
         *
         * @example
         * // Next page (using cursor from previous page)
         * const page2 = await repo.cursorPaginate({
         *   filters: { price: 'free' },
         *   cursor: 'eyJpZCI6MTAyMCwiY3JlYXRlZEF0IjoiMjAyNC0wMS0xNVQxMDowMDowMFoifQ==',
         *   limit: 20,
         *   sortBy: 'createdAt',
         *   sortOrder: 'desc'
         * });
         *
         * @example
         * // With multiple filters (search facets)
         * const results = await repo.cursorPaginate({
         *   filters: {
         *     price: 'free',
         *     tagIds: [1, 2, 3],
         *     styleId: 5,
         *     userId: 123,
         *     searchTerm: 'home'
         *   },
         *   cursor: null,
         *   limit: 20
         * });
         *
         * @example
         * // Ascending sort (oldest first)
         * const oldestFirst = await repo.cursorPaginate({
         *   filters: {},
         *   cursor: null,
         *   limit: 20,
         *   sortBy: 'createdAt',
         *   sortOrder: 'asc'
         * });
         */
        async cursorPaginate({
            filters = {},
            cursor = null,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeTotalCount = false,
            entityClass = null,
            entityOptions = {},
            trx = null,
        } = {}) {
            // Validate and cap limit
            const safeLimit = Math.min(Math.max(1, limit), 100);

            // Decode cursor if provided
            let cursorData = null;
            if (cursor) {
                cursorData = CursorEncoder.decode(cursor);
                if (!CursorEncoder.isValid(cursorData)) {
                    throw new Error('Invalid cursor token');
                }
            }

            // Check if this is array position sorting (Elasticsearch relevance)
            const isArrayPositionSort = sortBy === 'relevance' && filters.iconIdsOrder && Array.isArray(filters.iconIdsOrder);

            // Convert sortBy from camelCase to snake_case for database
            const dbSortField = isArrayPositionSort ? 'relevance' : this._toSnakeCase(sortBy);

            // Start building query
            let query = this.model.query();

            // Apply transaction if provided
            if (trx) {
                query = query.transacting(trx);
            }

            // ================================================================
            // Step 1: Apply all filters FIRST
            // ================================================================
            query = this._applyFilters(query, filters);

            // ================================================================
            // Step 2: Apply cursor condition (keyset WHERE)
            // ================================================================
            if (cursorData) {
                if (isArrayPositionSort) {
                    // Array position cursor: filter by position
                    query = this._applyArrayPositionCursor(
                        query,
                        cursorData,
                        filters.iconIdsOrder,
                        sortOrder
                    );
                } else {
                    // Field-based cursor: filter by field values
                    query = this._applyCursorCondition(
                        query,
                        cursorData,
                        dbSortField,
                        sortOrder
                    );
                }
            }

            // ================================================================
            // Step 3: Apply sorting
            // ================================================================
            if (isArrayPositionSort) {
                // Array position sort: ORDER BY array_position(ARRAY[iconIdsOrder], id)
                query = this._applyArrayPositionSort(query, filters.iconIdsOrder, sortOrder);
            } else {
                // Field-based sort: ORDER BY field, id
                const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
                query = query.orderBy(dbSortField, sortDirection);

                // Always sort by id as tiebreaker for uniqueness
                if (dbSortField !== 'id') {
                    query = query.orderBy('id', sortDirection);
                }
            }

            // ================================================================
            // Step 4: Fetch limit + 1 to check if there's a next page
            // ================================================================
            query = query.limit(safeLimit + 1);

            // Execute query
            const rawResults = await query;

            // ================================================================
            // Step 5: Determine if there's a next page
            // ================================================================
            const hasNextPage = rawResults.length > safeLimit;
            const results = hasNextPage ? rawResults.slice(0, safeLimit) : rawResults;

            // ================================================================
            // Step 6: Convert to entities
            // ================================================================
            const EntityClass = entityClass || this.entityClass;
            const entities = EntityClass
                ? results.map((row) => new EntityClass(row, entityOptions))
                : results;

            // ================================================================
            // Step 7: Generate cursors
            // ================================================================
            let startCursor = null;
            let endCursor = null;

            if (entities.length > 0) {
                if (isArrayPositionSort) {
                    // Array position cursors: encode position in array
                    startCursor = this._createArrayPositionCursor(entities[0], filters.iconIdsOrder);
                    endCursor = this._createArrayPositionCursor(entities[entities.length - 1], filters.iconIdsOrder);
                } else {
                    // Field-based cursors: encode field values
                    const sortFields = dbSortField !== 'id' ? [dbSortField, 'id'] : ['id'];
                    startCursor = CursorEncoder.fromRow(entities[0], sortFields, 'next');
                    endCursor = CursorEncoder.fromRow(entities[entities.length - 1], sortFields, 'next');
                }
            }

            // ================================================================
            // Step 8: Determine if there's a previous page
            // ================================================================
            const hasPreviousPage = !!cursor;

            // ================================================================
            // Step 9: Get total count (if requested - EXPENSIVE!)
            // ================================================================
            let totalCount = null;
            if (includeTotalCount) {
                const countQuery = this.model.query();
                if (trx) {
                    countQuery.transacting(trx);
                }
                this._applyFilters(countQuery, filters);
                totalCount = await countQuery.resultSize();
            }

            // ================================================================
            // Step 10: Return result with metadata
            // ================================================================
            return {
                results: entities,
                pageInfo: {
                    hasNextPage,
                    hasPreviousPage,
                    startCursor,
                    endCursor,
                    ...(totalCount !== null && { totalCount }),
                },
            };
        }

        /**
         * Apply filters to query.
         *
         * This is meant to be overridden in subclasses to handle domain-specific
         * filters. The base implementation does nothing.
         *
         * Subclasses should apply filters like:
         * - price (free, premium, all)
         * - tagIds (array of tag IDs)
         * - styleId (design style)
         * - userId (creator)
         * - searchTerm (text search)
         * - etc.
         *
         * @protected
         * @param {Object} query - Objection.js query builder
         * @param {Object} filters - Filter criteria
         * @returns {Object} Modified query
         *
         * @example
         * // Override in IconRepository
         * _applyFilters(query, filters) {
         *   if (filters.price) {
         *     query.where('price', filters.price);
         *   }
         *   if (filters.tagIds && filters.tagIds.length > 0) {
         *     query.whereIn('tags.id', filters.tagIds);
         *   }
         *   return query;
         * }
         */
        _applyFilters(query, filters) {
            // Base implementation - subclasses should override
            // Apply simple where clauses for basic filters
            if (filters && typeof filters === 'object') {
                for (const [key, value] of Object.entries(filters)) {
                    if (value !== undefined && value !== null) {
                        // Convert camelCase to snake_case for DB columns
                        const dbKey = this._toSnakeCase(key);

                        // Handle array values (whereIn)
                        if (Array.isArray(value)) {
                            query.whereIn(dbKey, value);
                        } else {
                            query.where(dbKey, value);
                        }
                    }
                }
            }
            return query;
        }

        /**
         * Apply cursor condition to query (keyset WHERE clause).
         *
         * Builds the keyset condition for efficient pagination:
         * - For DESC: WHERE (sort_field, id) < (cursor_value, cursor_id)
         * - For ASC: WHERE (sort_field, id) > (cursor_value, cursor_id)
         *
         * This uses composite index and is O(log n) instead of O(n).
         *
         * @protected
         * @param {Object} query - Objection.js query builder
         * @param {Object} cursorData - Decoded cursor data
         * @param {string} sortField - Database field to sort by (snake_case)
         * @param {string} sortOrder - 'asc' or 'desc'
         * @returns {Object} Modified query
         */
        _applyCursorCondition(query, cursorData, sortField, sortOrder) {
            const operator = sortOrder.toLowerCase() === 'asc' ? '>' : '<';
            const cursorValue = cursorData[this._toCamelCase(sortField)];
            const cursorId = cursorData.id;

            if (sortField !== 'id') {
                // Composite keyset: (sort_field, id) < (cursor_value, cursor_id)
                query.whereRaw(
                    `(${sortField}, id) ${operator} (?, ?)`,
                    [cursorValue, cursorId]
                );
            } else {
                // Simple keyset: id < cursor_id
                query.where('id', operator, cursorId);
            }

            return query;
        }

        /**
         * Apply array position cursor condition (for Elasticsearch relevance sorting).
         *
         * When sorting by Elasticsearch relevance, results are ordered by their position
         * in the iconIdsOrder array. The cursor contains the array position, and we need
         * to filter for items that come after that position.
         *
         * @protected
         * @param {Object} query - Objection.js query builder
         * @param {Object} cursorData - Decoded cursor data with arrayPosition
         * @param {Array<number>} iconIdsOrder - Ordered array of icon IDs from Elasticsearch
         * @param {string} sortOrder - 'asc' or 'desc'
         * @returns {Object} Modified query
         *
         * @example
         * // Cursor: { arrayPosition: 20, id: 5005 }
         * // iconIdsOrder: [1001, 2003, 5005, 3002] (from Elasticsearch)
         * // Query: WHERE array_position(ARRAY[iconIdsOrder], id) > 20
         */
        _applyArrayPositionCursor(query, cursorData, iconIdsOrder, sortOrder) {
            const operator = sortOrder.toLowerCase() === 'asc' ? '>' : '<';
            const arrayPosition = cursorData.arrayPosition;

            if (!arrayPosition || !Number.isInteger(arrayPosition)) {
                throw new Error('Invalid array position in cursor');
            }

            // Build array literal for SQL
            const idsArray = iconIdsOrder.map(id => parseInt(id, 10)).join(',');

            // Filter by array position
            query.whereRaw(
                `array_position(ARRAY[${idsArray}]::integer[], id) ${operator} ?`,
                [arrayPosition]
            );

            return query;
        }

        /**
         * Apply array position sorting (for Elasticsearch relevance).
         *
         * Orders results by their position in the iconIdsOrder array, which preserves
         * the relevance ranking from Elasticsearch.
         *
         * @protected
         * @param {Object} query - Objection.js query builder
         * @param {Array<number>} iconIdsOrder - Ordered array of icon IDs from Elasticsearch
         * @param {string} sortOrder - 'asc' or 'desc'
         * @returns {Object} Modified query
         *
         * @example
         * // iconIdsOrder: [1001, 2003, 5005, 3002] (from Elasticsearch)
         * // ORDER BY array_position(ARRAY[iconIdsOrder], id) ASC
         */
        _applyArrayPositionSort(query, iconIdsOrder, sortOrder) {
            const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            // Build array literal for SQL
            const idsArray = iconIdsOrder.map(id => parseInt(id, 10)).join(',');

            // Order by position in array
            query.orderByRaw(
                `array_position(ARRAY[${idsArray}]::integer[], id) ${sortDirection}`
            );

            return query;
        }

        /**
         * Create cursor from entity for array position sorting.
         *
         * For array position sorting, the cursor contains:
         * - arrayPosition: Position in the iconIdsOrder array
         * - id: Icon ID (for validation)
         * - sortType: 'arrayPosition' (to distinguish from field-based cursors)
         *
         * @protected
         * @param {Object} entity - Entity instance or plain object
         * @param {Array<number>} iconIdsOrder - Ordered array of icon IDs
         * @returns {string} Encoded cursor token
         *
         * @example
         * // Entity: { id: 5005, name: 'home-icon' }
         * // iconIdsOrder: [1001, 2003, 5005, 3002] (from Elasticsearch)
         * // Cursor: { arrayPosition: 3, id: 5005, sortType: 'arrayPosition' }
         */
        _createArrayPositionCursor(entity, iconIdsOrder) {
            const id = entity.id;
            const arrayPosition = iconIdsOrder.indexOf(id) + 1; // 1-based for array_position

            if (arrayPosition === 0) {
                throw new Error(`Entity ID ${id} not found in iconIdsOrder array`);
            }

            const cursorData = {
                arrayPosition,
                id,
                sortType: 'arrayPosition',
                direction: 'next'
            };

            return CursorEncoder.encode(cursorData);
        }

        /**
         * Convert camelCase to snake_case.
         *
         * @protected
         * @param {string} str - camelCase string
         * @returns {string} snake_case string
         */
        _toSnakeCase(str) {
            return str.replace(/([A-Z])/g, '_$1').toLowerCase();
        }

        /**
         * Convert snake_case to camelCase.
         *
         * @protected
         * @param {string} str - snake_case string
         * @returns {string} camelCase string
         */
        _toCamelCase(str) {
            return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        }
    };
};

module.exports = withCursorPagination;
