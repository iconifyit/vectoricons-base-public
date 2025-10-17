// Path: src/styles/CategoryRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const CategoryEntity = require('./CategoryEntity');

/**
 * Provides DB operations for categories.
 * @extends BaseRepository
 */
class CategoryRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'categories',
            entityClass: CategoryEntity,
        });
    }
}

module.exports = CategoryRepository;
