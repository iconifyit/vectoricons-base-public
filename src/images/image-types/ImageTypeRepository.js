// Path: src/images/image-types/ImageTypeRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const ImageTypeEntity = require('./ImageTypeEntity');

/**
 * @module Images Domain
 * @fileoverview ImageTypeRepository - Provides DB operations for image-types.
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
