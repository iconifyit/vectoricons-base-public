const DB = require('@vectoricons.net/db');
const FavoriteEntity = require('./FavoriteEntity');
const FavoriteRepository = require('./FavoriteRepository');
const FavoriteService = require('./FavoriteService');

/**
 * Initializes the FavoriteService with injected dependencies.
 * @returns {FavoriteService}
 */
const initFavoriteService = () => {
    return new FavoriteService({
        repository: new FavoriteRepository({ DB }),
        entityClass: FavoriteEntity,
    });
};

module.exports = {
    FavoriteEntity,
    FavoriteRepository,
    FavoriteService,
    initFavoriteService,
};
