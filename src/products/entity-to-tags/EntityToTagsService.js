// Path: src/products/entity-to-tags/EntityToTagsService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const EntityToTagsRepository = require('./EntityToTagsRepository');
const EntityToTagsEntity = require('./EntityToTagsEntity');

/**
 * @module Products Domain
 * @fileoverview EntityToTagsService - Service for managing entity-to-tags.
 */
class EntityToTagsService extends BaseService {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new EntityToTagsRepository({ DB }),
            entityClass: entityClass || EntityToTagsEntity,
        });
    }

    async getTagsForEntity(entityType, entityId, options = {}) {
        return this.repository.findByEntity(entityType, entityId, options);
    }

    async getEntitiesWithTag(tagId, options = {}) {
        return this.repository.findByTag(tagId, options);
    }

    async getEntitiesByType(entityType, options = {}) {
        return this.repository.findByEntityType(entityType, options);
    }

    async linkEntityToTag(entityType, entityId, tagId, options = {}) {
        return this.repository.linkEntityToTag(entityType, entityId, tagId, options);
    }

    async unlinkEntityFromTag(entityType, entityId, tagId, options = {}) {
        return this.repository.unlinkEntityFromTag(entityType, entityId, tagId, options);
    }

    async linkEntityToTags(entityType, entityId, tagIds, options = {}) {
        const promises = tagIds.map(tagId =>
            this.linkEntityToTag(entityType, entityId, tagId, options)
        );
        return Promise.all(promises);
    }

    async unlinkEntityFromAllTags(entityType, entityId, options = {}) {
        return this.repository.deleteWhere({
            entity_type: entityType,
            entity_id: entityId
        }, options);
    }
}

module.exports = EntityToTagsService;
