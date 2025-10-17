const CartItemEntity = require('./CartItemEntity');
const CartItemRepository = require('./CartItemRepository');
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');

/**
 * @module Carts Domain
 * @fileoverview CartItemService - Service for managing cart items data.
 * @class CartItemService
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