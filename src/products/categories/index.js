// Path: src/products/styles/index.js
const DB = require('@vectoricons.net/db');
const CategoryEntity = require('./CategoryEntity');
const CategoryRepository = require('./CategoryRepository');
const CategoryService = require('./CategoryService');

/**
 * Initializes the CategoryService with injected dependencies.
 * @returns {CategoryService}
 */
const initCategoryService = () => {
    return new CategoryService({
        repository: new CategoryRepository({ DB }),
        entityClass: CategoryEntity,
    });
};

module.exports = {
    CategoryEntity,
    CategoryRepository,
    CategoryService,
    initCategoryService,
};
