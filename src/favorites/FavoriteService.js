const BaseService = require('../common/BaseService');
const FavoriteRepository = require('./FavoriteRepository');
const FavoriteEntity = require('./FavoriteEntity');
const DB = require('@vectoricons.net/db');

/**
 * FavoriteService class
 * @class FavoriteService
 * @description This class orchestrates favorite item business logic.
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
