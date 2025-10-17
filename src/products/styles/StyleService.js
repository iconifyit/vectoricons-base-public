// Path: src/products/styles/StyleService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const StyleRepository = require('./StyleRepository');
const StyleEntity = require('./StyleEntity');

/**
 * @module Products Domain
 * @fileoverview StyleService - Service for managing styles.
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
