/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const OrderEntity = require('../OrderEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');
const enums = require('../../utils/enums');

let testCounter = 0;
let actualUser = null;
let actualCart = null;

beforeAll(async () => {
    // Get user for relation tests
    const user = await DB.users.query().where({ is_active: true }).first();
    if (user) {
        actualUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.is_active,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }

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
        userId: actualUser?.id || 1,
        cartId: actualCart?.id || 1,
        totalAmount: 100.00 + testCounter,
        discountedTotal: 95.00 + testCounter,
        status: enums.OrderStatus.PENDING,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    if (!actualUser || !actualCart) {
        throw new Error('Actual user or cart not initialized');
    }
    return {
        user: actualUser,
        cart: actualCart,
        orderItems: [],
        invoices: [],
        transactions: null,
    };
};

const updateOne = (entity) => {
    return {
        totalAmount: entity.totalAmount + 50,
        discountedTotal: entity.discountedTotal + 45,
        status: enums.OrderStatus.PROCESSING,
    };
};

entityContract({
    name: 'Order',
    Model: DB.orders,
    Entity: OrderEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
