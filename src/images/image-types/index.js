const DB = require('@vectoricons.net/db');
const ImageTypeEntity = require('./ImageTypeEntity');
const ImageTypeRepository = require('./ImageTypeRepository');
const ImageTypeService = require('./ImageTypeService');

/**
 * Initializes the ImageTypeService with injected dependencies.
 * @returns {ImageTypeService}
 */
const initImageTypeService = () => {
    return new ImageTypeService({
        repository: new ImageTypeRepository({ DB }),
        entityClass: ImageTypeEntity,
    });
};

module.exports = {
    ImageTypeEntity,
    ImageTypeRepository,
    ImageTypeService,
    initImageTypeService,
};
