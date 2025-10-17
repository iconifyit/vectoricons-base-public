/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SubscriptionPlanEntity = require('../SubscriptionPlanEntity');
const entityContract = require('../../../../__tests__/contracts/entity.contract');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        title: `Test Plan ${testCounter}`,
        description: 'Test subscription plan',
        seats: 5,
        price: '29.99',
        addons: 3,
        monthlyDownloads: 1000,
        billingPeriod: 'monthly',
        isActive: true,
        stripePriceId: `price_test_${testCounter}`,
        stripeLookupKey: `plan_test_${testCounter}`,
        pricePerCredit: '0.03',  // Generated field - include for entity contract tests
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        groupName: 'premium',
    };
};

const makeRelations = () => {
    testCounter++;
    return {};  // No relations for subscription plans
};

entityContract({
    name: 'SubscriptionPlan',
    Model: DB.subscriptionPlans,
    Entity: SubscriptionPlanEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
});
