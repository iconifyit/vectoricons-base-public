const DB = require('@vectoricons.net/db');

const IconEntity = require('./IconEntity.js');
const IconRepository = require('./IconRepository.js');
const IconService = require('./IconService.js');


/**
 * Initializes the IconService with injected dependencies.
 * @returns {IconService}
 */
const initIconService = () => {
    return new IconService({
        repository: new IconRepository({ DB }),
        entityClass: IconEntity,
    });
};

module.exports.initIconService = initIconService;