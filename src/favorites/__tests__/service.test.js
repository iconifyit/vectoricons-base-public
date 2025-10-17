/* eslint-env jest */

const FavoriteEntity = require('../FavoriteEntity');
const serviceContract = require('../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');
const { initFavoriteService } = require('../index');

serviceContract({
    name: 'Favorite',
    initService: initFavoriteService,
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
    whereForExisting: (data) => ({
        entity_id: data.entity_id || data.entityId,
        entity_type: data.entity_type || data.entityType,
        user_id: data.user_id || data.userId
    }),
    supportsRelations: true,
    supportsSoftDelete: false,
    supportsActivation: true,
    supportsGetAll: true,
    skipGetActive: false,
});
