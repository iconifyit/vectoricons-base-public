const DB = require('@vectoricons.net/db');
const ImageEntity = require('./ImageEntity');
const ImageRepository = require('./ImageRepository');
const ImageService = require('./ImageService');

/**
 * Initializes the ImageService with injected dependencies.
 * @returns {ImageService}
 */
const initImageService = () => {
    return new ImageService({
        repository: new ImageRepository({ DB }),
        entityClass: ImageEntity,
    });
};

module.exports = {
    ImageEntity,
    ImageRepository,
    ImageService,
    initImageService,
};
