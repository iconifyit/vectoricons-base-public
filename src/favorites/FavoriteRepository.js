const DB = require('@vectoricons.net/db');
const BaseRepository = require('../common/BaseRepository');
const FavoriteEntity = require('./FavoriteEntity');

/**
 * @module Favorites Domain
 * @fileoverview FavoriteRepository - Manages favorites data.
 * @class FavoriteRepository
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
