// Path: src/cashout-requests/CartService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../common/BaseService');
const CartEntity = require('./CartEntity');
const CartRepository = require('./CartRepository');

/**
 * @module Carts Domain
 * @fileoverview CartService - Service for managing carts data.
 * @class CartService
 */
class CartService extends BaseService {
    constructor({ repository = new CartRepository({ DB}), entityClass = CartEntity } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = CartService;
