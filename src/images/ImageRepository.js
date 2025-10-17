// Path: src/images/ImageRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../common/BaseRepository');
const ImageEntity = require('./ImageEntity');

/**
 * Provides DB operations for images.
 * @extends BaseRepository
 */
class ImageRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'images',
            entityClass: ImageEntity,
        });
    }
}

module.exports = ImageRepository;
