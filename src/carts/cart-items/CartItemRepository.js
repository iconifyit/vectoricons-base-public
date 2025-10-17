// Path : src/carts/CartItemRepository.js
const BaseRepository = require('../../common/BaseRepository');
const CartItemEntity = require('./CartItemEntity');
const enums = require('../../utils/enums');

/**
 * CartItemRepository class
 * @class CartItemRepository
 * @description This class is responsible for managing carts data.
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