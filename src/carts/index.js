// Path: src/banned-words/index.js
const DB = require('@vectoricons.net/db');
const CartEntity = require('./CartEntity');
const CartRepository = require('./CartRepository');
const CartService = require('./CartService');

/**
 * Initializes the CartService with injected dependencies.
 * @returns {CartService}
 */
const initCartService = () => {
    return new CartService({
        repository: new CartRepository({ DB }),
        entityClass: CartEntity,
    });
};

module.exports = {
    CartEntity,
    CartRepository,
    CartService,
    initCartService,
};
