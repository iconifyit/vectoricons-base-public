// Path: src/cashout-requests/CartService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../common/BaseService');
const CartEntity = require('./CartEntity');
const CartRepository = require('./CartRepository');

/**
 * CartService class
 * @class CartService
 * @description This class is responsible for managing cashout_requests data.
 */
class CartService extends BaseService {
    constructor({ repository = new CartRepository({ DB}), entityClass = CartEntity } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = CartService;
