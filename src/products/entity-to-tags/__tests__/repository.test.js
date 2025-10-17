/* eslint-env jest */

const EntityToTagsRepository = require('../EntityToTagsRepository');
const EntityToTagsEntity = require('../EntityToTagsEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new EntityToTagsRepository({ 
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'EntityToTags',
    modelName           : 'entityToTags',
    initRepository      : initRepository,
    Entity              : EntityToTagsEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        return { 
            entity_id   : data.entityId || data.entity_id,
            entity_type : data.entityType || data.entity_type,
            tag_id      : data.tagId || data.tag_id
        }
    },
    whereForExisting    : (data) => {
        return { 
            entity_id   : data.entityId || data.entity_id,
            entity_type : data.entityType || data.entity_type,
            tag_id      : data.tagId || data.tag_id
        }
    },
    supportsRelations: false,
    supportsFindAll: false,
    supportsPaginate: false,
    supportsExists: false
});
