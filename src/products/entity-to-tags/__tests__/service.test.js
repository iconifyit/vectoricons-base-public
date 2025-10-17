/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const EntityToTagsService = require('../EntityToTagsService');
const EntityToTagsRepository = require('../EntityToTagsRepository');
const EntityToTagsEntity = require('../EntityToTagsEntity');
const serviceContract = require('../../../__tests__/contracts/service.contract');
const { seedOne, seedMany } = require('./seed');

// let testCounter = 0;
// let testTagId = null;

// beforeAll(async () => {
//     const tag = await DB.tags.query().where({ is_active: true }).first();
//     if (tag) {
//         testTagId = tag.id;
//     }
// });

const initService = () => {
    const repository = new EntityToTagsRepository({ 
        DB : require('@vectoricons.net/db')
    });
    return new EntityToTagsService({ repository, entityClass: EntityToTagsEntity });
};

// Run contract tests
serviceContract({
    name        : 'EntityToTags',
    initService : initService,
    Entity      : EntityToTagsEntity,
    seedOne     : seedOne,
    seedMany    : seedMany,
    whereForUnique: (data) => ({
        entity_id   : data.entityId || data.entity_id,
        entity_type : data.entityType || data.entity_type,
        tag_id      : data.tagId || data.tag_id,
    }),
    whereForExisting: (data) => ({
        entity_id   : data.entityId || data.entity_id,
        entity_type : data.entityType || data.entity_type,
        tag_id      : data.tagId || data.tag_id,
    }),
    supportsRelations: false,
    supportsSoftDelete: false,
    supportsActivation: false,
    skipGetActive: true,
    supportsGetAll: false,
});
