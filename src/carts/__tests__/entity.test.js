/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const CartEntity = require('../CartEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');

let testCounter = 0;
let actualUser = null;

beforeAll(async () => {
    // Fetch first available user for relation tests
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
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        userId: actualUser?.id || 1,
        subtotal: 100.00 + testCounter,
        tax: 10.00,
        discount: 5.00,
        total: 105.00 + testCounter,
        status: 'Not processed',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    testCounter++;
    return {
        user: actualUser || {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            isActive: true,
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        cartItems: [
            {
                id: 1,
                cartId: testCounter,
                entityId: 100,
                entityType: 'icon',
                price: 10.00,
                isActive: true,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-02T00:00:00Z'),
            }
        ],
        orders: []
    };
};

const updateOne = (entity) => {
    return {
        subtotal: entity.subtotal + 50,
        tax: entity.tax + 5,
    };
};

entityContract({
    name: 'Cart',
    Model: DB.carts,
    Entity: CartEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
