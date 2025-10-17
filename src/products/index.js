module.exports.ProductTypeEntity = require('./ProductTypeEntity.js');
module.exports.StyleEntity = require('./StyleEntity.js');
module.exports.categories = require('./categories');
module.exports.families = require('./families');
module.exports.icons = require('./icons');
module.exports.illustrations = require('./illustrations');
module.exports.sets = require('./sets');
module.exports.subscriptions = require('./subscriptions');
module.exports.tags = require('./tags');

module.exports.initIconService = require('./icons').initIconService;
module.exports.initIllustrationService = require('./illustrations').initIllustrationService;
module.exports.initFamilyService = require('./families').initFamilyService;
module.exports.initSetService = require('./sets').initSetService;
module.exports.initSubscriptionPlanService = require('./subscriptions/subscription-plans').initSubscriptionPlanService;


// const initProductTypeService = () => {
//     return new ProductTypeService({
//         repository: new ProductTypeRepository({ DB }),
//         entityClass: ProductTypeEntity,
//     });
// };

// module.exports.initProductTypeService = initProductTypeService;

// const initStyleService = () => {
//     return new StyleService({
//         repository: new StyleRepository({ DB }),
//         entityClass: StyleEntity,
//     });
// };

// module.exports.initStyleService = initStyleService;

// const initTagService = () => {
//     return new TagService({
//         repository: new TagRepository({ DB }),
//         entityClass: TagEntity,
//     });
// };

// module.exports.initTagService = initTagService;