
'use strict';

const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const ProductTypeEntity = require('./ProductTypeEntity');

/**
 * ProductTypeRepository class
 * @class ProductTypeRepository
 * @description This class is responsible for managing product_types data.
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