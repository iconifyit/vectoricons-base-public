// Path: src/products/subscriptions/subscription-plans/SubscriptionPlanEntity.js
const { createEntityFromModel } = require('../../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview SubscriptionPlanEntity - Immutable subscription-plan representation.
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