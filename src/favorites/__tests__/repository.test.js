/* eslint-env jest */

const FavoriteRepository = require('../FavoriteRepository');
const FavoriteEntity = require('../FavoriteEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');

const initRepository = () => {
    return new FavoriteRepository({
        DB: require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name: 'Favorite',
    modelName: 'favorites',
    initRepository: initRepository,
    Entity: FavoriteEntity,
    seedOne: seedOne,
    seedMany: seedMany,
    whereForUnique: (data) => {
        return {
            entity_id: data.entity_id,
            entity_type: data.entity_type,
            user_id: data.user_id
        };
    },
    whereForExisting: (data) => {
        return {
            entity_id: data.entity_id || data.entityId,
            entity_type: data.entity_type || data.entityType,
            user_id: data.user_id || data.userId
        };
    },
    supportsRelations: true,
    relationGraph: '[user]',
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
