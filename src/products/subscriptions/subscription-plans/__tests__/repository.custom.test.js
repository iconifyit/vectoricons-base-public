/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const SubscriptionPlanRepository = require('../SubscriptionPlanRepository');
const SubscriptionPlanEntity = require('../SubscriptionPlanEntity');

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

const initRepository = () => {
    return new SubscriptionPlanRepository({ DB });
};

// Custom repository method tests
describe('SubscriptionPlanRepository - Custom Methods', () => {
    let repository;
    let trx;

    beforeAll(async () => {
        repository = new SubscriptionPlanRepository({ DB: require('@vectoricons.net/db') });
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
        }
    });

    describe('findByBillingPeriod', () => {
        test('finds subscription plans by billing_period (monthly)', async () => {
            const monthly1 = await seedOne({ billing_period: 'monthly' });
            const monthly2 = await seedOne({ billing_period: 'monthly' });
            const yearly = await seedOne({ billing_period: 'yearly' });

            const created1 = await repository.create(monthly1, { trx });
            const created2 = await repository.create(monthly2, { trx });
            await repository.create(yearly, { trx });

            const monthlyPlans = await repository.findByBillingPeriod('monthly', { trx });
            const ourPlans = monthlyPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.billingPeriod === 'monthly')).toBe(true);
            expect(ourPlans.every(p => p.isActive)).toBe(true);
        });

        test('finds subscription plans by billing_period (yearly)', async () => {
            const monthly = await seedOne({ billing_period: 'monthly' });
            const yearly1 = await seedOne({ billing_period: 'yearly' });
            const yearly2 = await seedOne({ billing_period: 'yearly' });

            await repository.create(monthly, { trx });
            const created1 = await repository.create(yearly1, { trx });
            const created2 = await repository.create(yearly2, { trx });

            const yearlyPlans = await repository.findByBillingPeriod('yearly', { trx });
            const ourPlans = yearlyPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.billingPeriod === 'yearly')).toBe(true);
            expect(ourPlans.every(p => p.isActive)).toBe(true);
        });

        test('excludes inactive plans from findByBillingPeriod', async () => {
            const inactive = await seedOne({ billing_period: 'monthly', is_active: false });
            const created = await repository.create(inactive, { trx });

            const monthlyPlans = await repository.findByBillingPeriod('monthly', { trx });
            const found = monthlyPlans.find(p => p.id === created.id);

            expect(found).toBeUndefined();
        });

        test('returns empty array for billing period with no plans', async () => {
            const plans = await repository.findByBillingPeriod('monthly', { trx });
            expect(Array.isArray(plans)).toBe(true);
        });
    });

    describe('findByGroupName', () => {
        test('finds subscription plans by group_name', async () => {
            const premium1 = await seedOne({ group_name: 'premium' });
            const premium2 = await seedOne({ group_name: 'premium' });
            const basic = await seedOne({ group_name: 'basic' });

            const created1 = await repository.create(premium1, { trx });
            const created2 = await repository.create(premium2, { trx });
            await repository.create(basic, { trx });

            const premiumPlans = await repository.findByGroupName('premium', { trx });
            const ourPlans = premiumPlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(2);
            expect(ourPlans.every(p => p.groupName === 'premium')).toBe(true);
            expect(ourPlans.every(p => p.isActive)).toBe(true);
        });

        test('excludes inactive plans from findByGroupName', async () => {
            const inactive = await seedOne({ group_name: 'premium', is_active: false });
            const created = await repository.create(inactive, { trx });

            const premiumPlans = await repository.findByGroupName('premium', { trx });
            const found = premiumPlans.find(p => p.id === created.id);

            expect(found).toBeUndefined();
        });

        test('returns empty array for group with no plans', async () => {
            const plans = await repository.findByGroupName('nonexistent', { trx });
            expect(Array.isArray(plans)).toBe(true);
            expect(plans.length).toBe(0);
        });
    });

    describe('findAllActive', () => {
        test('returns only active subscription plans', async () => {
            const active1 = await seedOne({ is_active: true });
            const active2 = await seedOne({ is_active: true });
            const inactive = await seedOne({ is_active: false });

            const created1 = await repository.create(active1, { trx });
            const created2 = await repository.create(active2, { trx });
            const createdInactive = await repository.create(inactive, { trx });

            const activePlans = await repository.findAllActive({ trx });

            const ourActivePlans = activePlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );
            const foundInactive = activePlans.find(p => p.id === createdInactive.id);

            expect(ourActivePlans.length).toBe(2);
            expect(ourActivePlans.every(p => p.isActive)).toBe(true);
            expect(foundInactive).toBeUndefined();
        });

        test('returns empty array when no active plans exist', async () => {
            const inactive1 = await seedOne({ is_active: false });
            const inactive2 = await seedOne({ is_active: false });

            const created1 = await repository.create(inactive1, { trx });
            const created2 = await repository.create(inactive2, { trx });

            const activePlans = await repository.findAllActive({ trx });

            const ourPlans = activePlans.filter(p =>
                p.id === created1.id || p.id === created2.id
            );

            expect(ourPlans.length).toBe(0);
        });
    });
});
