/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SubscriptionPlanService = require('../SubscriptionPlanService');
const SubscriptionPlanRepository = require('../SubscriptionPlanRepository');
const SubscriptionPlanEntity = require('../SubscriptionPlanEntity');
const serviceContract = require('../../../../__tests__/contracts/service.contract');

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
        billing_period: opts.billing_period || 'monthly',
        is_active: opts.is_active !== undefined ? opts.is_active : true,
        stripe_price_id: `price_test_${testCounter}`,
        stripe_lookup_key: `plan_test_${testCounter}`,
    };
    // Only add group_name if it's a string (not null/undefined)
    if (opts.group_name) {
        data.group_name = opts.group_name;
    }
    return data;
};

const initService = () => {
    const repository = new SubscriptionPlanRepository({ DB });
    return new SubscriptionPlanService({ repository, entityClass: SubscriptionPlanEntity });
};

// Run contract tests
serviceContract({
    name: 'SubscriptionPlan',
    initService: initService,
    Entity: SubscriptionPlanEntity,
    seedOne: seedOne,
    whereForUnique: (data) => ({ title: data.title, billing_period: data.billing_period }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsTimestamps: true,
    skipGetActive: false,
});

// Custom service tests
describe('SubscriptionPlanService - Custom Methods', () => {
    let service;
    let trx;

    beforeAll(async () => {
        service = initService();
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
        }
    });

    describe('Subscription Plan Creation', () => {
        test('creates subscription plan with all required fields', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            expect(plan).toBeInstanceOf(SubscriptionPlanEntity);
            expect(plan.id).toBeDefined();
            expect(plan.title).toBe(planData.title);
            expect(plan.stripePriceId).toBe(planData.stripe_price_id);
            expect(plan.billingPeriod).toBe('monthly');
            expect(plan.isActive).toBe(true);
        });

        test('creates subscription plan with monthly billing period', async () => {
            const planData = await seedOne({ billing_period: 'monthly' });
            const plan = await service.create(planData, { trx });

            expect(plan.billingPeriod).toBe('monthly');
        });

        test('creates subscription plan with yearly billing period', async () => {
            const planData = await seedOne({ billing_period: 'yearly' });
            const plan = await service.create(planData, { trx });

            expect(plan.billingPeriod).toBe('yearly');
        });

        test('creates subscription plan with optional group_name', async () => {
            const planData = await seedOne({ group_name: 'premium' });
            const plan = await service.create(planData, { trx });

            expect(plan.groupName).toBe('premium');
        });

        test('creates subscription plan without group_name', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            // Database returns null for nullable fields not set
            expect(plan.groupName).toBeNull();
        });
    });

    describe('Billing Period Management', () => {
        test('getSubscriptionPlansByBillingPeriod returns monthly plans', async () => {
            const monthly1 = await seedOne({ billing_period: 'monthly' });
            const monthly2 = await seedOne({ billing_period: 'monthly' });
            const yearly = await seedOne({ billing_period: 'yearly' });

            const created1 = await service.create(monthly1, { trx });
            const created2 = await service.create(monthly2, { trx });
            await service.create(yearly, { trx });

            const monthlyPlans = await service.getSubscriptionPlansByBillingPeriod('monthly', { trx });
            const ourPlans = monthlyPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.billingPeriod === 'monthly')).toBe(true);
        });

        test('getSubscriptionPlansByBillingPeriod returns yearly plans', async () => {
            const monthly = await seedOne({ billing_period: 'monthly' });
            const yearly1 = await seedOne({ billing_period: 'yearly' });
            const yearly2 = await seedOne({ billing_period: 'yearly' });

            await service.create(monthly, { trx });
            const created1 = await service.create(yearly1, { trx });
            const created2 = await service.create(yearly2, { trx });

            const yearlyPlans = await service.getSubscriptionPlansByBillingPeriod('yearly', { trx });
            const ourPlans = yearlyPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.billingPeriod === 'yearly')).toBe(true);
        });

        test('getSubscriptionPlansByBillingPeriod excludes inactive plans', async () => {
            const active = await seedOne({ billing_period: 'monthly', is_active: true });
            const inactive = await seedOne({ billing_period: 'monthly', is_active: false });

            const createdActive = await service.create(active, { trx });
            const createdInactive = await service.create(inactive, { trx });

            const monthlyPlans = await service.getSubscriptionPlansByBillingPeriod('monthly', { trx });

            const foundActive = monthlyPlans.find(p => p.id === createdActive.id);
            const foundInactive = monthlyPlans.find(p => p.id === createdInactive.id);

            expect(foundActive).toBeDefined();
            expect(foundInactive).toBeUndefined();
        });
    });

    describe('Group Name Management', () => {
        test('getSubscriptionPlansByGroupName returns plans in group', async () => {
            const premium1 = await seedOne({ group_name: 'premium' });
            const premium2 = await seedOne({ group_name: 'premium' });
            const basic = await seedOne({ group_name: 'basic' });

            const created1 = await service.create(premium1, { trx });
            const created2 = await service.create(premium2, { trx });
            await service.create(basic, { trx });

            const premiumPlans = await service.getSubscriptionPlansByGroupName('premium', { trx });
            const ourPlans = premiumPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.groupName === 'premium')).toBe(true);
        });

        test('getSubscriptionPlansByGroupName excludes inactive plans', async () => {
            const active = await seedOne({ group_name: 'premium', is_active: true });
            const inactive = await seedOne({ group_name: 'premium', is_active: false });

            const createdActive = await service.create(active, { trx });
            const createdInactive = await service.create(inactive, { trx });

            const premiumPlans = await service.getSubscriptionPlansByGroupName('premium', { trx });

            const foundActive = premiumPlans.find(p => p.id === createdActive.id);
            const foundInactive = premiumPlans.find(p => p.id === createdInactive.id);

            expect(foundActive).toBeDefined();
            expect(foundInactive).toBeUndefined();
        });

        test('getSubscriptionPlansByGroupName returns empty array for nonexistent group', async () => {
            const plans = await service.getSubscriptionPlansByGroupName('nonexistent', { trx });
            expect(Array.isArray(plans)).toBe(true);
            expect(plans.length).toBe(0);
        });
    });

    describe('Active Plans Management', () => {
        test('getAllActiveSubscriptionPlans returns only active plans', async () => {
            const active1 = await seedOne({ is_active: true });
            const active2 = await seedOne({ is_active: true });
            const inactive = await seedOne({ is_active: false });

            const created1 = await service.create(active1, { trx });
            const created2 = await service.create(active2, { trx });
            const createdInactive = await service.create(inactive, { trx });

            const activePlans = await service.getAllActiveSubscriptionPlans({ trx });

            const ourActivePlans = activePlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );
            const foundInactive = activePlans.find(p => p.id === createdInactive.id);

            expect(ourActivePlans.length).toBe(2);
            expect(ourActivePlans.every(p => p.isActive)).toBe(true);
            expect(foundInactive).toBeUndefined();
        });
    });

    describe('Stripe Integration', () => {
        test('creates plan with stripe_price_id', async () => {
            const planData = await seedOne();
            planData.stripe_price_id = 'price_12345';
            const plan = await service.create(planData, { trx });

            expect(plan.stripePriceId).toBe('price_12345');
        });

        test('creates plan with stripe_lookup_key', async () => {
            const planData = await seedOne();
            planData.stripe_lookup_key = 'premium_monthly';
            const plan = await service.create(planData, { trx });

            expect(plan.stripeLookupKey).toBe('premium_monthly');
        });

        test('creates plan without stripe_lookup_key', async () => {
            const planData = await seedOne();
            delete planData.stripe_lookup_key;
            const plan = await service.create(planData, { trx });

            // Database returns null for nullable fields not set
            expect(plan.stripeLookupKey).toBeNull();
        });
    });

    describe('Price and Downloads Management', () => {
        test('creates plan with price', async () => {
            const planData = await seedOne();
            planData.price = 49.99;
            const plan = await service.create(planData, { trx });

            expect(plan.price).toBe('49.99');
        });

        test('creates plan with monthly_downloads', async () => {
            const planData = await seedOne();
            planData.monthly_downloads = 5000;
            const plan = await service.create(planData, { trx });

            expect(plan.monthlyDownloads).toBe(5000);
        });

        test('price_per_credit is calculated for monthly plan', async () => {
            const planData = await seedOne();
            planData.price = 100.00;
            planData.monthly_downloads = 1000;
            planData.billing_period = 'monthly';
            const plan = await service.create(planData, { trx });

            // price_per_credit = price / monthly_downloads = 100 / 1000 = 0.10
            expect(plan.pricePerCredit).toBe('0.10');
        });

        test('price_per_credit is calculated for yearly plan', async () => {
            const planData = await seedOne();
            planData.price = 1200.00;
            planData.monthly_downloads = 1000;
            planData.billing_period = 'yearly';
            const plan = await service.create(planData, { trx });

            // price_per_credit = (price / 12) / monthly_downloads = (1200 / 12) / 1000 = 0.10
            expect(plan.pricePerCredit).toBe('0.10');
        });

        test('price_per_credit handles zero monthly_downloads', async () => {
            const planData = await seedOne();
            planData.price = 100.00;
            planData.monthly_downloads = 0;
            planData.billing_period = 'monthly';
            const plan = await service.create(planData, { trx });

            // price_per_credit should be NULL when monthly_downloads is 0 (division by zero)
            expect(plan.pricePerCredit).toBeNull();
        });
    });

    describe('Seats and Addons Management', () => {
        test('creates plan with seats', async () => {
            const planData = await seedOne();
            planData.seats = 10;
            const plan = await service.create(planData, { trx });

            expect(plan.seats).toBe(10);
        });

        test('creates plan with addons', async () => {
            const planData = await seedOne();
            planData.addons = 5;
            const plan = await service.create(planData, { trx });

            expect(plan.addons).toBe(5);
        });

        test('seats defaults to 0', async () => {
            const planData = await seedOne();
            delete planData.seats;
            const plan = await service.create(planData, { trx });

            expect(plan.seats).toBe(0);
        });

        test('addons defaults to 0', async () => {
            const planData = await seedOne();
            delete planData.addons;
            const plan = await service.create(planData, { trx });

            expect(plan.addons).toBe(0);
        });
    });

    describe('Activation Management', () => {
        test('plan is active by default', async () => {
            const planData = await seedOne();
            delete planData.is_active;
            const plan = await service.create(planData, { trx });

            expect(plan.isActive).toBe(true);
        });

        test('can create inactive plan', async () => {
            const planData = await seedOne({ is_active: false });
            const plan = await service.create(planData, { trx });

            expect(plan.isActive).toBe(false);
        });

        test('can deactivate plan', async () => {
            const planData = await seedOne({ is_active: true });
            const plan = await service.create(planData, { trx });

            await service.deactivate(plan.id, { trx });
            const deactivated = await service.getById(plan.id, { trx });
            expect(deactivated.isActive).toBe(false);
        });

        test('can reactivate plan', async () => {
            const planData = await seedOne({ is_active: false });
            const plan = await service.create(planData, { trx });

            await service.activate(plan.id, { trx });
            const reactivated = await service.getById(plan.id, { trx });
            expect(reactivated.isActive).toBe(true);
        });
    });

    describe('Update Management', () => {
        test('can update plan title', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            await service.update(plan.id, { title: 'Updated Plan' }, { trx });
            const updated = await service.getById(plan.id, { trx });
            expect(updated.title).toBe('Updated Plan');
        });

        test('can update plan price', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            await service.update(plan.id, { price: 99.99 }, { trx });
            const updated = await service.getById(plan.id, { trx });
            expect(updated.price).toBe('99.99');
        });

        test('can update plan billing_period', async () => {
            const planData = await seedOne({ billing_period: 'monthly' });
            const plan = await service.create(planData, { trx });

            await service.update(plan.id, { billing_period: 'yearly' }, { trx });
            const updated = await service.getById(plan.id, { trx });
            expect(updated.billingPeriod).toBe('yearly');
        });

        test('can update plan group_name', async () => {
            const planData = await seedOne({ group_name: 'basic' });
            const plan = await service.create(planData, { trx });

            await service.update(plan.id, { group_name: 'premium' }, { trx });
            const updated = await service.getById(plan.id, { trx });
            expect(updated.groupName).toBe('premium');
        });
    });

    describe('Timestamps', () => {
        test('sets createdAt on creation', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            expect(plan.createdAt).toBeDefined();
            expect(plan.createdAt).toBeInstanceOf(Date);
        });

        test('sets updatedAt on creation', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            expect(plan.updatedAt).toBeDefined();
            expect(plan.updatedAt).toBeInstanceOf(Date);
        });

        test('updatedAt is set on update', async () => {
            const planData = await seedOne();
            const plan = await service.create(planData, { trx });

            await service.update(plan.id, { title: 'Updated' }, { trx });
            const updated = await service.getById(plan.id, { trx });

            // Verify updatedAt exists and is a Date (DB trigger handles the update)
            expect(updated.updatedAt).toBeDefined();
            expect(updated.updatedAt).toBeInstanceOf(Date);
        });
    });
});
