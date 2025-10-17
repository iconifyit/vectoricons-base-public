/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const CartItemEntity = require('../CartItemEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');
const enums = require('../../../utils/enums');

let testCounter = 0;
let actualCart = null;

beforeAll(async () => {
    // Create a cart for relation tests
    const cart = await DB.carts.query().insert({
        user_id: 1,
        status: enums.cartStatus.NotProcessed,
    }).returning('*');

    if (cart) {
        actualCart = {
            id: cart.id,
            userId: cart.user_id,
            subtotal: cart.subtotal,
            tax: cart.tax,
            discount: cart.discount,
            total: cart.total,
            status: cart.status,
            createdAt: cart.created_at,
            updatedAt: cart.updated_at,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        cartId: actualCart?.id || 1,
        entityId: 100 + testCounter,
        entityType: 'icon',
        price: 10.00 + testCounter,
        isActive: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    if (!actualCart) {
        throw new Error('Actual cart not initialized');
    }
    return { cart: actualCart };
};

const updateOne = (entity) => {
    return {
        price: entity.price + 5,
        isActive: !entity.isActive,
    };
};

entityContract({
    name: 'CartItem',
    Model: DB.cartItems,
    Entity: CartItemEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
