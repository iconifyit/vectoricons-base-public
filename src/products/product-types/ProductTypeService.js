// Path: src/products/product-types/ProductTypeService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const ProductTypeEntity = require('./ProductTypeEntity');
const ProductTypeRepository = require('./ProductTypeRepository');
const { withActivatable } = require('../../common/mixins/service');

/**
 * @module Products Domain
 * @fileoverview ProductTypeService - Service for managing product types with activation support.
 * @class ProductTypeService
 */
class ProductTypeService extends withActivatable(BaseService) {
    constructor({ repository = new ProductTypeRepository({ DB }), entityClass = ProductTypeEntity } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = ProductTypeService;