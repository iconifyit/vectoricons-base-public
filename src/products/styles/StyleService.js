// Path: src/products/styles/StyleService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const StyleRepository = require('./StyleRepository');
const StyleEntity = require('./StyleEntity');

/**
 * Service for managing styles.
 * @extends BaseService
 */
class StyleService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new StyleRepository({ DB }),
            entityClass: entityClass || StyleEntity,
        });
    }
}

module.exports = StyleService;
