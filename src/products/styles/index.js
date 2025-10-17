// Path: src/products/styles/index.js
const DB = require('@vectoricons.net/db');
const StyleEntity = require('./StyleEntity');
const StyleRepository = require('./StyleRepository');
const StyleService = require('./StyleService');

/**
 * Initializes the StyleService with injected dependencies.
 * @returns {StyleService}
 */
const initStyleService = () => {
    return new StyleService({
        repository: new StyleRepository({ DB }),
        entityClass: StyleEntity,
    });
};

module.exports = {
    StyleEntity,
    StyleRepository,
    StyleService,
    initStyleService,
};
