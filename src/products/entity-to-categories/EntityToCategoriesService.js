// Path: src/products/entity-to-categories/EntityToCategoriesService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const EntityToCategoriesRepository = require('./EntityToCategoriesRepository');
const EntityToCategoriesEntity = require('./EntityToCategoriesEntity');

/**
 * @module Products Domain
 * @fileoverview EntityToCategoriesService - Service for managing entity-to-categories.
 */
class EntityToCategoriesService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new EntityToCategoriesRepository({ DB }),
            entityClass: entityClass || EntityToCategoriesEntity,
        });
    }
}

module.exports = EntityToCategoriesService;
