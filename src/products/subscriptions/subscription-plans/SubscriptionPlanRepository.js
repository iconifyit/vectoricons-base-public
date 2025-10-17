/**
 * @module Products Domain
 * @fileoverview SubscriptionPlanRepository - Manages subscription_plans data.
 * @class SubscriptionPlanRepository
 */

const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../../common/BaseRepository');
const SubscriptionPlanEntity = require('./SubscriptionPlanEntity');

class SubscriptionPlanRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'subscriptionPlans',
            entityClass: SubscriptionPlanEntity,
        });
    }

    findByBillingPeriod(billingPeriod, options = {}) {
        return this.findAll({ billing_period: billingPeriod, is_active: true }, {
            ...options,
            entityClass: SubscriptionPlanEntity
        });
    }

    findByGroupName(groupName, options = {}) {
        return this.findAll({ group_name: groupName, is_active: true }, {
            ...options,
            entityClass: SubscriptionPlanEntity
        });
    }

    findAllActive(options = {}) {
        return this.findAll({ is_active: true }, {
            ...options,
            entityClass: SubscriptionPlanEntity
        });
    }
}

module.exports = SubscriptionPlanRepository;