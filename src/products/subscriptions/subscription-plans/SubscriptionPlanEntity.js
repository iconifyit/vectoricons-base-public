// Path: src/products/subscriptions/subscription-plans/SubscriptionPlanEntity.js
const { createEntityFromModel } = require('../../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a subscription-plan item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/subscription-plans.js} Objection.js model for subscription-plans
 */
class SubscriptionPlanEntity extends createEntityFromModel(DB.subscriptionPlans, {}, {
    allowedColumns: [
        'id',
        'title',
        'description',
        'seats',
        'price',
        'addons',
        'monthlyDownloads',
        'billingPeriod',
        'isActive',
        'stripePriceId',
        'stripeLookupKey',
        'pricePerCredit',
        'createdAt',
        'updatedAt',
        'groupName'
    ]
}) {}

module.exports = SubscriptionPlanEntity;