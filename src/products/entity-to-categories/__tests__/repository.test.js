/* eslint-env jest */

const EntityToCategoriesRepository = require('../EntityToCategoriesRepository');
const EntityToCategoriesEntity = require('../EntityToCategoriesEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new EntityToCategoriesRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'EntityToCategories',
    modelName           : 'entityToCategories',
    initRepository      : initRepository,
    Entity              : EntityToCategoriesEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        return {
            entity_id   : data.entityId || data.entity_id,
            entity_type : data.entityType || data.entity_type,
            category_id : data.categoryId || data.category_id
        }
    },
    whereForExisting    : (data) => {
        return {
            entity_id   : data.entityId || data.entity_id,
            entity_type : data.entityType || data.entity_type,
            category_id : data.categoryId || data.category_id
        }
    },
    supportsRelations: false,
});
