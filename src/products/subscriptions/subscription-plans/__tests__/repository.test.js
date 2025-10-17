/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SubscriptionPlanRepository = require('../SubscriptionPlanRepository');
const SubscriptionPlanEntity = require('../SubscriptionPlanEntity');
const repositoryContract = require('../../../../__tests__/contracts/repository.contract');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    testCounter++;
    const data = {
        title: `Test Plan ${testCounter}`,
        description: 'Test subscription plan',
        seats: 5,
        price: 29.99,
        addons: 3,
        monthly_downloads: 1000,
        billing_period: 'monthly',
        is_active: true,
        stripe_price_id: `price_test_${testCounter}`,
        stripe_lookup_key: `plan_test_${testCounter}`,
    };
    // Only add group_name if it's a string (not null/undefined)
    if (opts.group_name) {
        data.group_name = opts.group_name;
    }
    return data;
};

const initRepository = () => {
    return new SubscriptionPlanRepository({ DB });
};

repositoryContract({
    name: 'SubscriptionPlan',
    initRepository: initRepository,
    Entity: SubscriptionPlanEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ title: data.title, billing_period: data.billing_period }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
    modelName: 'subscriptionPlans',
});
