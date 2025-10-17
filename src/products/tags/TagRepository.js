// Path: src/products/tags/TagRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const TagEntity = require('./TagEntity');

/**
 * Provides DB operations for tags.
 * Extends BaseRepository to include common repository functionality.
 * @extends BaseRepository
 */
class TagRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'tags',
            entityClass: TagEntity,
        });
    }
}

module.exports = TagRepository;
