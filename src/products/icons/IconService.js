/**
 * @module Products Domain
 * @fileoverview IconService - Domain service for icon management.
 *
 * This is a concrete example of how domain services extend BaseService with
 * additional mixins and custom business logic. IconService manages the icon
 * catalog with 750,000+ icon assets.
 *
 * **Mixin Composition:**
 * ```
 * IconService extends
 *   withActivatable(              // Activation state management (activate, deactivate)
 *   withPluggableCacheableAndSoftDeletable( // Combined mixin for:
 *     BaseService                 //   - Event-driven plugins (emit icon.created, etc.)
 *   )                             //   - Read-through caching (cache getById, etc.)
 * )                               //   - Soft deletes (mark deleted without removing)
 *                                 //   - Observability (already in BaseService)
 * ```
 *
 * **What You Get Automatically:**
 * - ✅ All BaseService CRUD methods (getById, create, update, delete, paginate)
 * - ✅ Automatic timing, logging, metrics for all operations
 * - ✅ Event emission (icon.created, icon.updated, icon.deleted)
 * - ✅ Read-through caching (getById cached automatically)
 * - ✅ Soft delete support (marks is_deleted=true instead of removing)
 * - ✅ Activation management (activate, deactivate, toggleActive)
 *
 * **Usage Example:**
 * ```javascript
 * const iconService = new IconService();
 *
 * // Create icon (automatically: logged, cached, event emitted)
 * const icon = await iconService.create({
 *   name: 'home',
 *   svgPath: 'M3 9l9-7 9 7v11...',
 *   setId: 10
 * });
 * // Logs: "icon-service.create success 45ms"
 * // Emits: icon.created event
 * // Returns: IconEntity instance (frozen)
 *
 * // Get by ID (cached after first fetch)
 * const icon2 = await iconService.getById(icon.id);
 * // First call: queries DB, caches result
 * // Second call: returns from cache (< 1ms)
 *
 * // Soft delete (marks deleted, doesn't remove)
 * await iconService.softDelete(icon.id);
 * // Sets: is_deleted=true, is_active=false
 * // Clears cache
 * // Emits: icon.deleted event
 * ```
 *
 * @see {@link BaseService} For inherited CRUD methods
 * @see {@link IconRepository} For custom query methods
 * @see {@link IconEntity} For entity structure
 */

const DB = require('@vectoricons.net/db');
const IconEntity     = require('./IconEntity');
const IconRepository = require('./IconRepository');
const BaseService = require('../../common/BaseService');

const { withPluggableCacheableAndSoftDeletable } = require('../../common/mixins/service');
const { withActivatable } = require('../../common/mixins/service');

/**
 * Icon domain service with full mixin composition.
 *
 * Manages icon assets including CRUD operations, caching, event emission,
 * soft deletes, and activation state. Extends BaseService with additional
 * mixins for production-ready features.
 *
 * **Mixin Stack (bottom to top):**
 * 1. BaseService (with withObservable) - Core CRUD + automatic observability
 * 2. withPluggableCacheableAndSoftDeletable - Event emission, caching, soft deletes
 * 3. withActivatable - Activation state management
 *
 * **Custom Business Logic:**
 * In addition to inherited CRUD methods, IconService provides domain-specific
 * queries via IconRepository (getIconByUniqueId, getIconsBySetId, etc.).
 *
 * @class IconService
 * @extends {BaseService}
 *
 * @example
 * // Basic CRUD (inherited from BaseService)
 * const iconService = new IconService();
 *
 * const icon = await iconService.create({
 *   name: 'home',
 *   svgPath: 'M3 9l9-7...',
 *   setId: 10,
 *   isActive: true
 * });
 *
 * const found = await iconService.getById(icon.id); // Cached
 * const updated = await iconService.update(icon.id, { name: 'home-alt' });
 * await iconService.softDelete(icon.id); // Soft delete
 *
 * @example
 * // Custom queries (domain-specific)
 * const iconsBySet = await iconService.getIconsBySetId(10);
 * const activeIcons = await iconService.getAllActiveIcons();
 * const iconByUid = await iconService.getIconByUniqueId('home-123');
 *
 * @example
 * // Activation management (from withActivatable)
 * await iconService.activate(icon.id);   // is_active=true
 * await iconService.deactivate(icon.id); // is_active=false
 * await iconService.toggleActive(icon.id); // Toggle state
 *
 * @example
 * // Pagination (inherited from BaseService)
 * const result = await iconService.paginate(
 *   { setId: 10, isActive: true },
 *   1,    // page
 *   20    // pageSize
 * );
 * // Returns: { results: IconEntity[], total, page, pageSize, totalPages }
 */
class IconService extends withActivatable(withPluggableCacheableAndSoftDeletable(BaseService)) {
    /**
     * Construct IconService with repository and entity class.
     *
     * @param {Object} [options={}] - Service configuration
     * @param {IconRepository} [options.repository] - Icon repository instance
     * @param {Function} [options.entityClass] - Icon entity class
     *
     * @example
     * // Default construction
     * const iconService = new IconService();
     *
     * @example
     * // Custom repository (e.g., for testing)
     * const mockRepo = new IconRepository({ DB: mockDB });
     * const iconService = new IconService({ repository: mockRepo });
     */
    constructor({ repository = new IconRepository({ DB }), entityClass = IconEntity } = {}) {
        super({ repository, entityClass });
    }

    /**
     * Get icon by unique identifier.
     *
     * Domain-specific query delegating to IconRepository. The unique ID is a
     * combination of set identifier and icon name for human-readable URLs.
     *
     * @param {string} uniqueId - Unique identifier (e.g., "material-design-home")
     * @param {Object} [options={}] - Query options
     * @param {Object} [options.trx] - Knex transaction
     * @returns {Promise<IconEntity|null>} Icon entity or null if not found
     *
     * @example
     * const icon = await iconService.getIconByUniqueId('material-design-home');
     * console.log(icon.name); // 'home'
     * console.log(icon.setId); // 10 (Material Design set)
     */
    async getIconByUniqueId(uniqueId, options = {}) {
        return this.repository.findByUniqueId(uniqueId, options);
    }

    /**
     * Get all icons in a specific set.
     *
     * Domain-specific query for fetching all icons that belong to a set
     * (e.g., all icons in "Material Design Icons" set).
     *
     * @param {number} setId - Set ID to filter by
     * @param {Object} [options={}] - Query options
     * @param {Object} [options.trx] - Knex transaction
     * @returns {Promise<IconEntity[]>} Array of icon entities
     *
     * @example
     * const materialIcons = await iconService.getIconsBySetId(10);
     * console.log(materialIcons.length); // 2500+ icons
     * console.log(materialIcons[0].setId); // 10
     */
    async getIconsBySetId(setId, options = {}) {
        return this.repository.findBySetId(setId, options);
    }

    /**
     * Get all active (published) icons across all sets.
     *
     * Returns only icons where is_active=true and is_deleted=false.
     * Useful for public-facing endpoints that should only show published content.
     *
     * **Warning:** This can return 750,000+ icons. Consider using pagination instead:
     * ```javascript
     * await iconService.paginate({ isActive: true, isDeleted: false }, page, pageSize);
     * ```
     *
     * @param {Object} [options={}] - Query options
     * @param {Object} [options.trx] - Knex transaction
     * @returns {Promise<IconEntity[]>} Array of active icon entities
     *
     * @example
     * const activeIcons = await iconService.getAllActiveIcons();
     * console.log(activeIcons.length); // 750,000+
     * console.log(activeIcons.every(icon => icon.isActive)); // true
     */
    async getAllActiveIcons(options = {}) {
        return this.repository.findAllActive(options);
    }

    /**
     * Paginate icons using cursor-based keyset pagination.
     *
     * Provides efficient pagination for large icon datasets (750K+ icons) with
     * support for complex search facets including:
     * - Price filtering (free, premium, all)
     * - Tag filtering (multiple tags)
     * - Style filtering
     * - User/creator filtering
     * - Set and family filtering
     * - Text search
     * - Elasticsearch result IDs
     *
     * **Performance:**
     * - O(log n + limit) vs O(n) for offset pagination
     * - Consistent results even when data changes
     * - No "page drift" from concurrent modifications
     *
     * **Cursor Format:**
     * Cursors are base64-encoded tokens containing the last seen item's sort fields.
     * Use `pageInfo.endCursor` from one page as the `cursor` parameter for the next page.
     *
     * @param {Object} filters - Search facets and filter criteria
     * @param {string} [filters.price] - 'free', 'premium', or 'all'
     * @param {Array<number>} [filters.tagIds] - Array of tag IDs to filter by
     * @param {number} [filters.styleId] - Style ID to filter by
     * @param {number} [filters.userId] - Creator user ID to filter by
     * @param {number} [filters.setId] - Set ID to filter by
     * @param {number} [filters.familyId] - Family ID to filter by
     * @param {string} [filters.searchTerm] - Text search on icon name
     * @param {Array<number>} [filters.iconIds] - Specific icon IDs (e.g., from Elasticsearch)
     * @param {boolean} [filters.isActive] - Filter by active status
     * @param {boolean} [filters.isDeleted] - Filter by deleted status
     * @param {string|null} cursor - Cursor token from previous page (null for first page)
     * @param {number} [limit=20] - Page size (max 100)
     * @param {string} [sortBy='createdAt'] - Field to sort by
     * @param {string} [sortOrder='desc'] - 'asc' or 'desc'
     * @param {Object} [options={}] - Additional options
     * @param {boolean} [options.includeTotalCount=false] - Whether to include total count (expensive!)
     * @param {Object} [options.trx] - Knex transaction
     *
     * @returns {Promise<Object>} Pagination result with results and metadata
     *
     * @example
     * // First page (newest free icons)
     * const page1 = await iconService.cursorPaginate({
     *   price: 'free'
     * }, null, 20, 'createdAt', 'desc');
     *
     * console.log(page1.results);           // IconEntity[]
     * console.log(page1.pageInfo.hasNextPage); // true
     * console.log(page1.pageInfo.endCursor);   // 'eyJpZC...'
     *
     * @example
     * // Next page (using cursor from page1)
     * const page2 = await iconService.cursorPaginate({
     *   price: 'free'
     * }, page1.pageInfo.endCursor, 20);
     *
     * @example
     * // Complex search with multiple facets
     * const results = await iconService.cursorPaginate({
     *   price: 'free',
     *   tagIds: [1, 2, 3],      // Icons with these tags
     *   styleId: 5,              // Specific design style
     *   searchTerm: 'home',      // Text search
     *   userId: 123              // From specific creator
     * }, null, 20);
     *
     * @example
     * // With Elasticsearch integration
     * const elasticResults = await elasticsearchService.search('home icon');
     * const iconIds = elasticResults.hits.map(h => h.id);
     *
     * const results = await iconService.cursorPaginate({
     *   iconIds: iconIds,  // Only these icon IDs
     *   price: 'free'
     * }, null, 20);
     *
     * @example
     * // Oldest icons first (ascending sort)
     * const oldestIcons = await iconService.cursorPaginate({
     *   price: 'all'
     * }, null, 20, 'createdAt', 'asc');
     */
    async cursorPaginate(
        filters = {},
        cursor = null,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        options = {}
    ) {
        return this.repository.cursorPaginate({
            filters,
            cursor,
            limit,
            sortBy,
            sortOrder,
            includeTotalCount: options.includeTotalCount || false,
            entityClass: this.entityClass,
            entityOptions: {},
            trx: options.trx,
        });
    }

    /**
     * Paginate icons with search facets (convenience method).
     *
     * Simplified interface for cursor pagination with common search facets.
     * Delegates to cursorPaginate() with pre-configured defaults.
     *
     * **Sorting Options:**
     * - `'newest'` - Sort by created_at DESC (PostgreSQL)
     * - `'bestseller'` - Sort by popularity DESC (PostgreSQL)
     * - `'relevance'` - Sort by Elasticsearch relevance (requires iconIds)
     *
     * @param {Object} params - Search parameters
     * @param {string} [params.price='all'] - Price filter
     * @param {Array<number>} [params.tagIds=[]] - Tag IDs
     * @param {number} [params.styleId] - Style ID
     * @param {string} [params.searchTerm] - Text search
     * @param {Array<number>} [params.iconIds] - Icon IDs from Elasticsearch (for relevance sort)
     * @param {string} [params.cursor] - Cursor token
     * @param {number} [params.limit=20] - Page size
     * @param {string} [params.sort='newest'] - Sort type ('newest', 'bestseller', or 'relevance')
     * @param {Object} [options={}] - Additional options
     *
     * @returns {Promise<Object>} Pagination result
     *
     * @example
     * // Simple search (newest first)
     * const results = await iconService.searchIcons({
     *   price: 'free',
     *   searchTerm: 'home',
     *   sort: 'newest',
     *   limit: 20
     * });
     *
     * @example
     * // Bestsellers
     * const bestsellers = await iconService.searchIcons({
     *   price: 'all',
     *   sort: 'bestseller',
     *   limit: 20
     * });
     *
     * @example
     * // Elasticsearch relevance sorting
     * const esResults = await elasticsearchService.search('home icon');
     * const iconIds = esResults.hits.map(h => h.id);
     *
     * const results = await iconService.searchIcons({
     *   iconIds: iconIds,      // Ranked IDs from Elasticsearch
     *   price: 'free',
     *   sort: 'relevance',     // Preserves Elasticsearch ranking
     *   limit: 20
     * });
     *
     * @example
     * // Next page (same sort and filters)
     * const page2 = await iconService.searchIcons({
     *   iconIds: iconIds,      // SAME IDs for consistency
     *   price: 'free',
     *   sort: 'relevance',
     *   cursor: results.pageInfo.endCursor,
     *   limit: 20
     * });
     */
    async searchIcons(params = {}, options = {}) {
        const {
            price = 'all',
            tagIds = [],
            styleId,
            userId,
            setId,
            familyId,
            searchTerm,
            iconIds,
            cursor = null,
            limit = 20,
            sort = 'newest',
        } = params;

        // Map sort type to sortBy/sortOrder
        let sortBy, sortOrder;
        let filters;

        if (sort === 'relevance' && iconIds && iconIds.length > 0) {
            // Relevance sorting: use array position with Elasticsearch order
            sortBy = 'relevance';
            sortOrder = 'asc';  // Array positions are ascending (1, 2, 3, ...)
            filters = {
                price,
                tagIds: tagIds.length > 0 ? tagIds : undefined,
                styleId,
                userId,
                setId,
                familyId,
                searchTerm,
                iconIdsOrder: iconIds,  // Use iconIdsOrder to preserve ES ranking
            };
        } else if (sort === 'bestseller') {
            // Bestseller sorting: PostgreSQL popularity field
            sortBy = 'popularity';
            sortOrder = 'desc';
            filters = {
                price,
                tagIds: tagIds.length > 0 ? tagIds : undefined,
                styleId,
                userId,
                setId,
                familyId,
                searchTerm,
                iconIds: iconIds && iconIds.length > 0 ? iconIds : undefined,
            };
        } else {
            // Newest sorting (default): PostgreSQL created_at field
            sortBy = 'createdAt';
            sortOrder = 'desc';
            filters = {
                price,
                tagIds: tagIds.length > 0 ? tagIds : undefined,
                styleId,
                userId,
                setId,
                familyId,
                searchTerm,
                iconIds: iconIds && iconIds.length > 0 ? iconIds : undefined,
            };
        }

        return this.cursorPaginate(
            filters,
            cursor,
            limit,
            sortBy,
            sortOrder,
            options
        );
    }
}

module.exports = IconService;