// Path: src/products/entity-to-categories/index.js
const DB = require('@vectoricons.net/db');
const EntityToCategoriesEntity = require('./EntityToCategoriesEntity');
const EntityToCategoriesRepository = require('./EntityToCategoriesRepository');
const EntityToCategoriesService = require('./EntityToCategoriesService');

/**
 * Initializes the EntityToCategoriesService with injected dependencies.
 * @returns {EntityToCategoriesService}
 */
const initEntityToCategoriesService = () => {
    return new EntityToCategoriesService({
        repository: new EntityToCategoriesRepository({ DB }),
        entityClass: EntityToCategoriesEntity,
    });
};

module.exports = {
    EntityToCategoriesEntity,
    EntityToCategoriesRepository,
    EntityToCategoriesService,
    initEntityToCategoriesService,
};
