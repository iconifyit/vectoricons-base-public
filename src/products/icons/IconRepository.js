const BaseRepository = require('../../common/BaseRepository');
const { Icons }      = require('@vectoricons.net/db');
const IconEntity     = require('./IconEntity');
const { withCursorPagination } = require('../../common/mixins/repository');

/**
 * Raw Icon Repository before mixin application.
 *
 * Provides basic icon data access methods. Extended with cursor pagination
 * via withCursorPagination mixin at export.
 */
class RawIconRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'icons',
            entityClass: IconEntity,
        });
    }

    /**
     * Find icon by unique identifier.
     *
     * @param {string} uniqueId - Icon unique ID
     * @param {Object} options - Query options
     * @returns {Promise<IconEntity|null>}
     */
    findByUniqueId(uniqueId, options = {}) {
        return this.findOne({ unique_id: uniqueId }, {
            ...options,
            entityClass: IconEntity
        });
    }

    /**
     * Find all icons in a set.
     *
     * @param {number} setId - Set ID
     * @param {Object} options - Query options
     * @returns {Promise<IconEntity[]>}
     */
    findBySetId(setId, options = {}) {
        return this.findAll({ set_id: setId, is_deleted: false }, {
            ...options,
            entityClass: IconEntity
        });
    }

    /**
     * Find all active (published) icons.
     *
     * @param {Object} options - Query options
     * @returns {Promise<IconEntity[]>}
     */
    findAllActive(options = {}) {
        return this.findAll({ is_deleted: false, is_active: true }, {
            ...options,
            entityClass: IconEntity
        });
    }

    /**
     * Apply icon-specific filters to cursor pagination query.
     *
     * Handles search facets including:
     * - price (free, premium, all)
     * - tagIds (array of tag IDs)
     * - styleId (design style)
     * - userId (creator filter)
     * - setId (icon set filter)
     * - familyId (family of sets)
     * - searchTerm (text search on name)
     * - iconIds (specific icon IDs, e.g. from Elasticsearch - unordered)
     * - iconIdsOrder (ordered icon IDs from Elasticsearch for relevance sorting)
     * - isActive (publication status)
     * - isDeleted (deletion status)
     *
     * @protected
     * @param {Object} query - Objection.js query builder
     * @param {Object} filters - Filter criteria
     * @returns {Object} Modified query
     *
     * @example
     * // Called internally by cursorPaginate()
     * query = this._applyFilters(query, {
     *   price: 'free',
     *   tagIds: [1, 2, 3],
     *   styleId: 5
     * });
     *
     * @example
     * // With Elasticsearch relevance (ordered IDs)
     * query = this._applyFilters(query, {
     *   iconIdsOrder: [1001, 2003, 5005, ...],  // Elasticsearch ranked order
     *   price: 'free'
     * });
     */
    _applyFilters(query, filters) {
        if (!filters || typeof filters !== 'object') {
            return query;
        }

        // ================================================================
        // Price filter (free, premium, all)
        // ================================================================
        if (filters.price) {
            const price = filters.price.toLowerCase();
            if (price === 'free') {
                query.where('icons.price', 0);
            } else if (price === 'premium') {
                query.where('icons.price', '>', 0);
            }
            // 'all' means no filter
        }

        // ================================================================
        // Tag IDs filter (icons with specific tags)
        // ================================================================
        if (filters.tagIds && Array.isArray(filters.tagIds) && filters.tagIds.length > 0) {
            query.whereExists(function() {
                this.select('*')
                    .from('entity_to_tags')
                    .whereRaw('entity_to_tags.entity_id = icons.id')
                    .where('entity_to_tags.entity_type', 'icon')
                    .whereIn('entity_to_tags.tag_id', filters.tagIds);
            });
        }

        // ================================================================
        // Style ID filter
        // ================================================================
        if (filters.styleId) {
            query.where('icons.style_id', filters.styleId);
        }

        // ================================================================
        // User ID filter (creator)
        // ================================================================
        if (filters.userId) {
            query.where('icons.user_id', filters.userId);
        }

        // ================================================================
        // Set ID filter
        // ================================================================
        if (filters.setId) {
            query.where('icons.set_id', filters.setId);
        }

        // ================================================================
        // Family ID filter (join to sets table)
        // ================================================================
        if (filters.familyId) {
            query.leftJoin('sets', 'icons.set_id', 'sets.id')
                .where('sets.family_id', filters.familyId);
        }

        // ================================================================
        // Search term (text search on name)
        // ================================================================
        if (filters.searchTerm) {
            query.where('icons.name', 'ilike', `%${filters.searchTerm}%`);
        }

        // ================================================================
        // Icon IDs filter (specific IDs, e.g., from Elasticsearch)
        // ================================================================
        // If iconIdsOrder is provided (for relevance sorting), use it exclusively
        // Otherwise fall back to iconIds (unordered)
        if (filters.iconIdsOrder && Array.isArray(filters.iconIdsOrder) && filters.iconIdsOrder.length > 0) {
            query.whereIn('icons.id', filters.iconIdsOrder);
        } else if (filters.iconIds && Array.isArray(filters.iconIds) && filters.iconIds.length > 0) {
            query.whereIn('icons.id', filters.iconIds);
        }

        // ================================================================
        // Active filter (defaults to true if not specified)
        // ================================================================
        if (filters.isActive !== undefined) {
            query.where('icons.is_active', filters.isActive);
        } else {
            // Default: only active icons
            query.where('icons.is_active', true);
        }

        // ================================================================
        // Deleted filter (defaults to false if not specified)
        // ================================================================
        if (filters.isDeleted !== undefined) {
            query.where('icons.is_deleted', filters.isDeleted);
        } else {
            // Default: not deleted
            query.where('icons.is_deleted', false);
        }

        return query;
    }
}

/**
 * Icon repository with cursor pagination support.
 *
 * Extends RawIconRepository with withCursorPagination mixin to provide
 * efficient keyset-based pagination for large icon datasets (750K+ icons).
 *
 * @example
 * // Cursor paginate icons
 * const result = await iconRepo.cursorPaginate({
 *   filters: {
 *     price: 'free',
 *     tagIds: [1, 2, 3],
 *     styleId: 5
 *   },
 *   cursor: null,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 *
 * @example
 * // Next page
 * const page2 = await iconRepo.cursorPaginate({
 *   filters: { price: 'free' },
 *   cursor: result.pageInfo.endCursor,
 *   limit: 20
 * });
 */
const IconRepository = withCursorPagination(RawIconRepository);

module.exports = IconRepository;