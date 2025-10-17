// Path: src/images/image-types/ImageTypeService.js
const ImageTypeRepository = require('./ImageTypeRepository');
const ImageTypeEntity = require('./ImageTypeEntity');
const BaseService = require('../../common/BaseService');
const DB = require('@vectoricons.net/db');

/**
 * Service for managing image types.
 * @extends BaseService
 */
class ImageTypeService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new ImageTypeRepository({ DB }),
            entityClass: entityClass || ImageTypeEntity,
        });
    }
}

module.exports = ImageTypeService;