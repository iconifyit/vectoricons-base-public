// Path: src/images/image-types/ImageTypeRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const ImageTypeEntity = require('./ImageTypeEntity');

/**
 * Provides DB operations for image-types.
 * @extends BaseRepository
 */
class ImageTypeRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'imageTypes',
            entityClass: ImageTypeEntity,
        });
    }
}

module.exports = ImageTypeRepository;
