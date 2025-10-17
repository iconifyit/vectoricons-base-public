/* eslint-env node */

/**
 * CartService
 *
 * - Extends BaseService so all the standard CRUD flows are consistent.
 * - Uses CartRepository for carts persistence.
 * - Uses CartItemRepository for cart_items persistence (same module boundary).
 * - Uses *other modules via their init<Service>Service()* for product reads.
 */

const BaseService = require('../common/BaseService');
const CartEntity = require('./CartEntity');
const CartRepository = require('./CartRepository');
const CartItemRepository = require('./cart-items/CartItemRepository');
const { withPluggable } = require('../common/mixins/service');

// Optional: centralize the allowed entity types we put in cart_items.entity_type
const PRODUCT_TYPES = {
    ICON          : 'icon',
    ILLUSTRATION  : 'illustration',
    SET           : 'set',
    FAMILY        : 'family',
    CREDITS       : 'credits',
    SUBSCRIPTION  : 'subscription',
};

/**
 * CartService class
 * @extends BaseService, withPluggable, withObservable
 */
class CartService extends withPluggable(BaseService) {
    /**
     * @param {Object} opts
     * @param {CartRepository} [opts.repository]        - repository for carts
     * @param {typeof CartEntity} [opts.entityClass]     - entity class for carts
     * @param {CartItemRepository} [opts.cartItemRepository]
     * @param {Object} [opts.services]                   - cross-module service registry (init<Service>Service() instances)
     *   {
     *     iconService,
     *     illustrationService,
     *     setService,
     *     familyService,
     *     creditsService,
     *     subscriptionService,
     *     couponCodeService,
     *   }
     */
    constructor({
        repository = new CartRepository(),
        entityClass = CartEntity,
        cartItemRepository = new CartItemRepository(),
        services = {},
    } = {}) {
        super({ repository, entityClass });
        this.cartItemRepository = cartItemRepository;
        this.services = services;
    }

    // ---------- Cart reads / writes ----------

    /**
     * Get a cart by id with user + items.
     * Returns raw with relations (or you can wrap if you prefer Entities here).
     */
    async getCartWithItems(id, { trx } = {}) {
        const [record] = await this.repository.withRelations(
            { id },
            '[user, cartItems]',
            { trx }
        );
        if (!record) {
            throw new Error('Cart not found');
        }
        return record;
    }

    /**
     * Find the user’s pending cart, with items.
     * If none, returns null.
     */
    async findPendingCartForUser(userId, { trx } = {}) {
        const cart = await this.repository.findOne(
            { user_id: userId, status: 'Not processed' },
            { trx, entityClass: this.entityClass }
        );
        if (!cart) return null;

        // Attach cartItems (raw) for convenience
        const [withItems] = await this.repository.withRelations(
            { id: cart.id },
            '[cartItems]',
            { trx }
        );
        return withItems || cart;
    }

    /**
     * Find or create a pending cart for the user.
     */
    async findOrCreatePendingCart(userId, { trx } = {}) {
        const existing = await this.findPendingCartForUser(userId, { trx });
        if (existing) return existing;

        const created = await this.repository.upsert(
            { user_id: userId, status: 'Not processed', subtotal: 0, tax: 0, discount: 0, total: 0 },
            { user_id: userId, status: 'Not processed' },
            { trx }
        );

        const [withItems] = await this.repository.withRelations(
            { id: created.id },
            '[cartItems]',
            { trx }
        );
        return withItems || created;
    }

    // ---------- Cart items ----------

    /**
     * Add (or upsert) a line item to a user’s pending cart.
     * This writes cart_items via our own repository AND updates cart totals.
     */
    async addItemToCart({ userId, entityId, entityType, price }, { trx } = {}) {
        // Validate type
        const type = String(entityType || '').toLowerCase();
        if (!Object.values(PRODUCT_TYPES).includes(type)) {
            throw new Error(`Unsupported entityType: ${entityType}`);
        }

        // Resolve the product via the appropriate service
        const product = await this.getProductService(type).getById(entityId, { trx });
        if (!product) {
            throw new Error(`Entity not found: ${entityType} ID ${entityId}`);
        }

        // Find/create pending cart
        const cart = await this.findOrCreatePendingCart(userId, { trx });

        // Upsert cart item (idempotent for the same {cart_id, entity_id, entity_type})
        await this.cartItemRepository.upsert(
            { cart_id: cart.id, entity_id: entityId, entity_type: type, price },
            { cart_id: cart.id, entity_id: entityId, entity_type: type },
            { trx }
        );

        // Update totals
        await this.updateTotals(cart.id, { trx });

        return this.getCartWithItems(cart.id, { trx });
    }

    /**
     * Upsert a batch of items into a user’s pending cart.
     */
    async upsertCartWithItems({ userId, cartItems }, { trx } = {}) {
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Items must be a non-empty array');
        }

        const cart = await this.findOrCreatePendingCart(userId, { trx });

        for (const item of cartItems) {
            const type = String(item.entity_type || item.entityType || '').toLowerCase();
            if (!Object.values(PRODUCT_TYPES).includes(type)) {
                throw new Error(`Unsupported entityType: ${item.entity_type || item.entityType}`);
            }

            // Validate existence via service
            const product = await this.getProductService(type).getById(item.entity_id || item.entityId, { trx });
            if (!product) {
                throw new Error(`Entity not found: ${type} ID ${item.entity_id || item.entityId}`);
            }

            await this.cartItemRepository.upsert(
                {
                    cart_id: cart.id,
                    entity_id: item.entity_id || item.entityId,
                    entity_type: type,
                    price: item.price,
                },
                {
                    cart_id: cart.id,
                    entity_id: item.entity_id || item.entityId,
                    entity_type: type,
                },
                { trx }
            );
        }

        await this.updateTotals(cart.id, { trx });
        return this.getCartWithItems(cart.id, { trx });
    }

    /**
     * Delete a single item and refresh totals.
     */
    async deleteCartItem({ cartId, entityId, entityType }, { trx } = {}) {
        const type = String(entityType || '').toLowerCase();
        await this.cartItemRepository.deleteWhere(
            { cart_id: cartId, entity_id: entityId, entity_type: type },
            { trx }
        );
        await this.updateTotals(cartId, { trx });
    }

    /**
     * Clear all items and reset totals.
     */
    async clearCart(cartId, { trx } = {}) {
        await this.cartItemRepository.deleteWhere({ cart_id: cartId }, { trx });
        await this.repository.update(cartId, { subtotal: 0, tax: 0, discount: 0, total: 0 }, { trx });
        return this.getCartWithItems(cartId, { trx });
    }

    // ---------- Totals / pricing ----------

    /**
     * Recompute totals from the current cart_items rows.
     * (This is a placeholder; customize your tax/discount strategy as needed.)
     */
    async updateTotals(cartId, { trx } = {}) {
        const items = await this.cartItemRepository.findAll({ cart_id: cartId }, { trx });
        const subtotal = (items || []).reduce((sum, it) => sum + Number(it.price || 0), 0);
        const tax = 0;
        const discount = 0;
        const total = Math.max(subtotal + tax - discount, 0);

        await this.repository.update(cartId, { subtotal, tax, discount, total }, { trx });
    }

    async getCartTotal(cart, { trx } = {}) {
        // If the caller passed a cart id, load it with items first
        const full = typeof cart === 'number' ? await this.getCartWithItems(cart, { trx }) : cart;
        const items = full?.cartItems || [];
        return items.reduce((sum, it) => sum + Number(it.price || 0), 0);
    }

    // ---------- Discounts / coupons ----------

    /**
     * Apply a coupon to a cart:
     *  - Validate via couponCodeService
     *  - Create a “cart” discount row (via CartRepository upsertDiscount if you keep that)
     *  - Optionally create per-item discount rows
     *  - Update cart.total
     */
    async applyDiscount({ cartId, couponCode }, { trx } = {}) {
        const { couponCodeService } = this.services;
        if (!couponCodeService) {
            throw new Error('couponCodeService not configured');
        }

        // Load current cart with items
        const cart = await this.getCartWithItems(cartId, { trx });

        // Validate coupon for this cart (business rules live in the coupon service)
        await couponCodeService.validateForCart({
            code: couponCode,
            cart,
            buyer: cart.user, // adjust if you use something else as “buyer”
        });

        // Compute totals before discount
        const originalPrice = await this.getCartTotal(cart, { trx });

        // Compute discounted total (simple example; defer logic to coupon service if preferred)
        const { discountedPrice, discountAmount } = this.calculateDiscount(
            originalPrice,
            await couponCodeService.getByCode(couponCode, { trx })
        );

        // Persist (parent) discount row if you keep a discounts table
        if (typeof this.repository.upsertDiscount === 'function') {
            const cartDiscount = await this.repository.upsertDiscount({
                coupon_code: couponCode,
                entity_type: 'cart',
                entity_id: cartId,
                original_price: originalPrice,
                discounted_price: discountedPrice,
                discount_amount: discountAmount,
                parent_id: null,
            }, undefined, { trx });

            // Per-item discounts (optional)
            await this.applyCartItemsDiscount({ cart, couponCode, parentId: cartDiscount?.id }, { trx });
        }

        // Update cart total
        await this.repository.update(cartId, { total: discountedPrice }, { trx });

        return this.getCartWithItems(cartId, { trx });
    }

    /**
     * Create per-item discount rows (optional; depends on your schema).
     */
    async applyCartItemsDiscount({ cart, couponCode, parentId }, { trx } = {}) {
        if (!Array.isArray(cart?.cartItems) || !this.repository.upsertDiscount) {
            return;
        }
        for (const item of cart.cartItems) {
            const price = Number(item.price || 0);
            const { discountedPrice, discountAmount } = this.calculateDiscount(
                price,
                await this.services.couponCodeService.getByCode(couponCode, { trx })
            );
            await this.repository.upsertDiscount({
                coupon_code: couponCode,
                entity_type: 'cart_item',
                entity_id: item.id,
                original_price: price,
                discounted_price: discountedPrice,
                discount_amount: discountAmount,
                parent_id: parentId || null,
            }, undefined, { trx });
        }
    }

    /**
     * Very simple discount math; most teams move this to the coupon service.
     * Expects coupon entities to expose getType()/getAmount() or you adapt here.
     */
    calculateDiscount(originalPrice, couponEntity) {
        const base = Number(originalPrice || 0);
        if (!couponEntity || typeof couponEntity.getType !== 'function') {
            return { discountedPrice: base, discountAmount: 0 };
        }

        const type = couponEntity.getType();
        const amt = Number(couponEntity.getAmount ? couponEntity.getAmount() : 0);

        if (type === 'percentage') {
            const discountAmount = base * (amt / 100);
            return { discountedPrice: Math.max(base - discountAmount, 0), discountAmount };
        }

        if (type === 'fixed') {
            const discountAmount = amt;
            return { discountedPrice: Math.max(base - discountAmount, 0), discountAmount };
        }

        return { discountedPrice: base, discountAmount: 0 };
    }

    // ---------- Helpers ----------

    /**
     * Map entity_type -> service used to read that product.
     * Throws if a service is not configured.
     */
    getProductService(type) {
        const {
            iconService,
            illustrationService,
            setService,
            familyService,
            creditsService,
            subscriptionService,
        } = this.services;

        switch (type) {
            case PRODUCT_TYPES.ICON: return assertService('iconService', iconService);
            case PRODUCT_TYPES.ILLUSTRATION: return assertService('illustrationService', illustrationService);
            case PRODUCT_TYPES.SET: return assertService('setService', setService);
            case PRODUCT_TYPES.FAMILY: return assertService('familyService', familyService);
            case PRODUCT_TYPES.CREDITS: return assertService('creditsService', creditsService);
            case PRODUCT_TYPES.SUBSCRIPTION: return assertService('subscriptionService', subscriptionService);
            default: throw new Error(`Unsupported entityType: ${type}`);
        }
    }
}

/**
 * Tiny guard to make missing service configs fail loudly & clearly.
 */
const assertService = (name, svc) => {
    if (!svc) throw new Error(`${name} not configured`);
    return svc;
};

CartService.PRODUCT_TYPES = PRODUCT_TYPES;

module.exports = CartService;