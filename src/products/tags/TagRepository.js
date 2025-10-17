// Path: src/products/tags/TagRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const TagEntity = require('./TagEntity');

/**
 * @module Products Domain
 * @fileoverview TagRepository - Provides DB operations for tags.
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
