
/**
 * @module Products Domain
 * @fileoverview SubscriptionPlanService - Service for managing subscription_plans data.
 * @class SubscriptionPlanService
 */

const DB = require('@vectoricons.net/db');
const SubscriptionPlanEntity = require('./SubscriptionPlanEntity');
const SubscriptionPlanRepository = require('./SubscriptionPlanRepository');
const BaseService = require('../../../common/BaseService');
const { withActivatable } = require('../../../common/mixins/service');

class SubscriptionPlanService extends withActivatable(BaseService) {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new SubscriptionPlanRepository({ DB }),
            entityClass: entityClass || SubscriptionPlanEntity,
        });
    }

    async getSubscriptionPlansByBillingPeriod(billingPeriod, options = {}) {
        return this.repository.findByBillingPeriod(billingPeriod, options);
    }

    async getSubscriptionPlansByGroupName(groupName, options = {}) {
        return this.repository.findByGroupName(groupName, options);
    }

    async getAllActiveSubscriptionPlans(options = {}) {
        return this.repository.findAllActive(options);
    }
}

module.exports = SubscriptionPlanService;