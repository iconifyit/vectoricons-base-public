// Path: src/products/entity-to-categories/EntityToCategoriesRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const EntityToCategoriesEntity = require('./EntityToCategoriesEntity');

/**
 * @module Products Domain
 * @fileoverview EntityToCategoriesRepository - Provides DB operations for entity-to-categories.
 */
class EntityToCategoriesRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'entityToCategories',
            entityClass: EntityToCategoriesEntity,
        });
    }
}

module.exports = EntityToCategoriesRepository;
