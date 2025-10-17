/**
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
     * @param {typeof IconEntity} [options.entityClass] - Icon entity class
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
}

module.exports = IconService;