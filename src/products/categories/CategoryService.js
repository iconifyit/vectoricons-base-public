// Path: src/products/categories/CategoryService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const CategoryRepository = require('./CategoryRepository');
const CategoryEntity = require('./CategoryEntity');
const { withActivatable } = require('../../common/mixins/service');

/**
 * @module Products Domain
 * @fileoverview CategoryService - Service for managing categories with activation support.
 * @class CategoryService
 */
class CategoryService extends withActivatable(BaseService) {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new CategoryRepository({ DB }),
            entityClass: entityClass || CategoryEntity,
        });
    }
}

module.exports = CategoryService;
