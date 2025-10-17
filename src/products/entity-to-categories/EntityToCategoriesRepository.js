// Path: src/products/entity-to-categories/EntityToCategoriesRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const EntityToCategoriesEntity = require('./EntityToCategoriesEntity');

/**
 * Provides DB operations for entity-to-categories.
 * Extends BaseRepository to include common repository functionality.
 * @extends BaseRepository
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
