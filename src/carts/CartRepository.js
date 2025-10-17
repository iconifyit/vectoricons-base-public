// Path : src/carts/CartRepository.js
const BaseRepository = require('../common/BaseRepository');
const CartEntity = require('./CartEntity');
const enums = require('../utils/enums');

/**
 * @module Carts Domain
 * @fileoverview CartRepository - Manages carts data.
 * @class CartRepository
 */
class CartRepository extends BaseRepository {
    /**
     * @param {Object} DB
     * @param {CartItemRepository} CartItemRepository
     * @param {ModelsRegistry} ModelsRegistry
     * @param {CouponCodeService} CouponCodeService
     */
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'carts',
            entityClass: CartEntity,
        });
    }

    /**
     * Get a cart by ID and fetch related data.
     * @param {Number} cartId - The cart ID.
     * @returns {Object} - The cart object.
     * @throws {Error} - If an error occurs.
     */
    async getCartWithItems(cartId) {
        // TODO: Add related entities like cart items, discounts, etc.
    }

    /**
     * Get a cart by user ID.
     * @param {Number} userId - The user ID.
     * @returns {Object} - The cart object.
     * @throws {Error} - If an error occurs.
     */
    async getCartByUserId(userId) {
        const cart = await this.findOne({
            user_id : userId,
            status  : enums.cartStatus.NotProcessed,
        });
        if (!cart) {
            return null;
        }
        return this.getCartWithItems(cart.id);
    }
}

module.exports = CartRepository;