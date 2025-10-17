const DB = require('@vectoricons.net/db');

const SubscriptionPlanEntity = require('./SubscriptionPlanEntity.js');
const SubscriptionPlanRepository = require('./SubscriptionPlanRepository.js');
const SubscriptionPlanService = require('./SubscriptionPlanService.js');

const initSubscriptionPlanService = () => {
    return new SubscriptionPlanService({
        repository: new SubscriptionPlanRepository({ DB }),
        entityClass: SubscriptionPlanEntity,
    });
};

module.exports.initSubscriptionPlanService = initSubscriptionPlanService;