const CartItemEntity = require('./CartItemEntity');
const CartItemRepository = require('./CartItemRepository');
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');

/**
 * CartItemService class
 * @class CartItemService
 * @description This class is responsible for managing cart_items data.
 */
class CartItemService extends BaseService {
    /**
     * @param {Object} options
     * @param {CartItemRepository} options.repository
     * @param {CartItemEntity} options.entityClass
     */
    constructor({ repository = new CartItemRepository({ DB }), entityClass = CartItemEntity } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = CartItemService;