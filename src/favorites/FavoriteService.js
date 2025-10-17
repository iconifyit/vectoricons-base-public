const BaseService = require('../common/BaseService');
const FavoriteRepository = require('./FavoriteRepository');
const FavoriteEntity = require('./FavoriteEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Favorites Domain
 * @fileoverview FavoriteService - Service for managing favorites business logic.
 * @class FavoriteService
 */
class FavoriteService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new FavoriteRepository({ DB }),
            entityClass: entityClass || FavoriteEntity,
        });
    }
}

module.exports = FavoriteService;
