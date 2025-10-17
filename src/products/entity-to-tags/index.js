// Path: src/products/entity-to-tags/index.js
const DB = require('@vectoricons.net/db');
const EntityToTagsEntity = require('./EntityToTagsEntity');
const EntityToTagsRepository = require('./EntityToTagsRepository');
const EntityToTagsService = require('./EntityToTagsService');

/**
 * Initializes the EntityToTagsService with injected dependencies.
 * @returns {EntityToTagsService}
 */
const initEntityToTagsService = () => {
    return new EntityToTagsService({
        repository: new EntityToTagsRepository({ DB }),
        entityClass: EntityToTagsEntity,
    });
};

module.exports = {
    EntityToTagsEntity,
    EntityToTagsRepository,
    EntityToTagsService,
    initEntityToTagsService,
};
