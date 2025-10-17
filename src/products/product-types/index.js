const ProductTypeService = require('./ProductTypeService');
const ProductTypeRepository = require('./ProductTypeRepository');
const DB = require('@vectoricons.net/db');

/**
 * Initializes the ProductTypeService with injected dependencies.
 * @returns {ProductTypeService}
 */
const initProductTypeService = () => {
    return new ProductTypeService({
        repository  : new ProductTypeRepository({ DB }),
        entityClass : require('./ProductTypeEntity'),
    });
};

module.exports = {
    ProductTypeService,
    ProductTypeRepository,
    initProductTypeService,
};