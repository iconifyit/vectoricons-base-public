
'use strict';

const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const ProductTypeEntity = require('./ProductTypeEntity');

/**
 * @module Products Domain
 * @fileoverview ProductTypeRepository - Manages product_types data.
 * @class ProductTypeRepository
 */
class ProductTypeRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName   : 'productTypes',
            entityClass : ProductTypeEntity,
        });
    }
}

module.exports = ProductTypeRepository;