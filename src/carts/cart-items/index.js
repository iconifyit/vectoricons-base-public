const CartItemService = require('./CartItemService');
const CartItemRepository = require('./CartItemRepository');
const CartItemEntity = require('./CartItemEntity');

/**
 * Initialize the cart item service
 * @returns {CartItemService} - The initialized cart item service
 * @throws {Error} - If the initialization fails
 */
const initCartItemService = () => {
    return new CartItemService({
        repository : new CartItemRepository({ DB: require('@vectoricons.net/db') }),
        entityClass: CartItemEntity,
    });
}

module.exports = {
    initCartItemService,
    CartItemService,
    CartItemRepository,
    CartItemEntity, 
};