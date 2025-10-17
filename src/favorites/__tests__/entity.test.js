/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const FavoriteEntity = require('../FavoriteEntity');
const entityContract = require('../../__tests__/contracts/entity.contract');
const { seedEntity } = require('./seed');

const makeRelations = () => {
    return {
        user: {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
        },
    };
};

const updateOne = (entity) => {
    return {
        entityType: 'illustration',
    };
};

entityContract({
    name          : 'Favorite',
    Model         : DB.favorites,
    Entity        : FavoriteEntity,
    seedOne       : seedEntity,
    makeRelations : makeRelations,
    updateOne     : updateOne,
});
