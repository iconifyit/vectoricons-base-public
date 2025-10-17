// Path : src/carts/CartItemRepository.js
const BaseRepository = require('../../common/BaseRepository');
const CartItemEntity = require('./CartItemEntity');
const enums = require('../../utils/enums');

/**
 * @module Carts Domain
 * @fileoverview CartItemRepository - Manages cart items data.
 * @class CartItemRepository
 */
class CartItemRepository extends BaseRepository {
    /**
     * @param {Object} DB
     * @param {CartItemItemRepository} CartItemItemRepository
     * @param {ModelsRegistry} ModelsRegistry
     * @param {CouponCodeService} CouponCodeService
     */
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'cartItems',
            entityClass: CartItemEntity,
        });
    }
}

module.exports = CartItemRepository;