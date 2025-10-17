// Path: src/products/entity-to-tags/EntityToTagsRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const EntityToTagsEntity = require('./EntityToTagsEntity');

/**
 * Provides DB operations for tags.
 * Extends BaseRepository to include common repository functionality.
 * @extends BaseRepository
 */
class EntityToTagsRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'entityToTags',
            entityClass: EntityToTagsEntity,
        });
    }

    findByEntity(entityType, entityId, options = {}) {
        return this.findAll({ entity_type: entityType, entity_id: entityId }, {
            ...options,
            entityClass: EntityToTagsEntity
        });
    }

    findByTag(tagId, options = {}) {
        return this.findAll({ tag_id: tagId }, {
            ...options,
            entityClass: EntityToTagsEntity
        });
    }

    findByEntityType(entityType, options = {}) {
        return this.findAll({ entity_type: entityType }, {
            ...options,
            entityClass: EntityToTagsEntity
        });
    }

    async linkEntityToTag(entityType, entityId, tagId, options = {}) {
        return this.create({
            entity_type: entityType,
            entity_id: entityId,
            tag_id: tagId
        }, options);
    }

    async unlinkEntityFromTag(entityType, entityId, tagId, options = {}) {
        return this.deleteWhere({
            entity_type: entityType,
            entity_id: entityId,
            tag_id: tagId
        }, options);
    }
}

module.exports = EntityToTagsRepository;
