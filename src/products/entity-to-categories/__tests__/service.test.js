/* eslint-env jest */

const EntityToCategoriesService = require('../EntityToCategoriesService');
const EntityToCategoriesRepository = require('../EntityToCategoriesRepository');
const EntityToCategoriesEntity = require('../EntityToCategoriesEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');

const initService = () => {
    const repository = new EntityToCategoriesRepository({
        DB : require('@vectoricons.net/db')
    });
    return new EntityToCategoriesService({ repository, entityClass: EntityToCategoriesEntity });
};

// Run contract tests
serviceContract({
    name        : 'EntityToCategories',
    initService : initService,
    Entity      : EntityToCategoriesEntity,
    seedOne     : seedOne,
    seedMany    : seedMany,
    whereForUnique: (data) => ({
        entity_id   : data.entityId || data.entity_id,
        entity_type : data.entityType || data.entity_type,
        category_id : data.categoryId || data.category_id,
    }),
    whereForExisting: (data) => ({
        entity_id   : data.entityId || data.entity_id,
        entity_type : data.entityType || data.entity_type,
        category_id : data.categoryId || data.category_id,
    }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: false,
    skipGetActive: true,
});
