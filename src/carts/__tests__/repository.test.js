/* eslint-env jest */

const CartRepository = require('../CartRepository');
const CartEntity = require('../CartEntity');
const repositoryContract = require('../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new CartRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'Cart',
    modelName           : 'carts',
    initRepository      : initRepository,
    Entity              : CartEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            user_id : data.userId || data.user_id,
            status  : data.status
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
