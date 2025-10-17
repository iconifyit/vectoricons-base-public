// Path: src/products/styles/StyleRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const StyleEntity = require('./StyleEntity');

/**
 * @module Products Domain
 * @fileoverview StyleRepository - Provides DB operations for styles.
 */
class StyleRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'styles',
            entityClass: StyleEntity,
        });
    }
}

module.exports = StyleRepository;
