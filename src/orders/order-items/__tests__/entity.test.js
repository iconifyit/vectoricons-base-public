/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const OrderItemEntity = require('../OrderItemEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');
const enums = require('../../../utils/enums');

let testCounter = 0;
let actualOrder = null;

beforeAll(async () => {
    // Create a cart and order for relation tests
    const cart = await DB.carts.query().insert({
        user_id: 1,
        status: enums.cartStatus.NotProcessed,
    }).returning('*');

    const order = await DB.orders.query().insert({
        user_id: 1,
        cart_id: cart.id,
        total_amount: 100.00,
        discounted_total: 95.00,
        status: enums.OrderStatus.PENDING,
    }).returning('*');

    if (order) {
        actualOrder = {
            id: order.id,
            userId: order.user_id,
            cartId: order.cart_id,
            totalAmount: order.total_amount,
            discountedTotal: order.discounted_total,
            status: order.status,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
        };
    }
});

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        orderId: actualOrder?.id || 1,
        entityId: 100 + testCounter,
        entityType: 'icon',
        cartItemId: null,
        amount: 10.00 + testCounter,
        discountedAmount: 9.00 + testCounter,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
    };
};

const makeRelations = () => {
    if (!actualOrder) {
        throw new Error('Actual order not initialized');
    }
    return {
        order: actualOrder,
        cartItems: null,
    };
};

const updateOne = (entity) => {
    return {
        amount: entity.amount + 5,
        discountedAmount: entity.discountedAmount + 4,
    };
};

entityContract({
    name: 'OrderItem',
    Model: DB.orderItems,
    Entity: OrderItemEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
