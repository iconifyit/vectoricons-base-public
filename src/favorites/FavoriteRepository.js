const DB = require('@vectoricons.net/db');
const BaseRepository = require('../common/BaseRepository');
const FavoriteEntity = require('./FavoriteEntity');

/**
 * FavoriteRepository class
 * @class FavoriteRepository
 * @description This class is responsible for managing favorites data.
 */
class FavoriteRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'favorites',
            entityClass: FavoriteEntity,
        });
    }
}

module.exports = FavoriteRepository;
