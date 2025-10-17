// Path: src/images/ImageService.js
const ImageRepository = require('./ImageRepository');
const ImageTypeRepository = require('./image-types/ImageTypeRepository');
const ImageEntity = require('./ImageEntity');
const BaseService = require('../common/BaseService');
const { withActivatable, withPluggableCacheableAndSoftDeletable } = require('../common/mixins/service');
const DB = require('@vectoricons.net/db');

/**
 * @module Images Domain
 * @fileoverview ImageService - Composes BaseService with Observability + (Pluggable + Cacheable + SoftDelete + Activatable) mixins.
 */
class ImageService extends withActivatable(withPluggableCacheableAndSoftDeletable(BaseService)) {
    constructor({ repository, entityClass, cache, events } = {}) {
        super({
            repository: repository || new ImageRepository({ DB }),
            entityClass: entityClass || ImageEntity,
            cache,
            events,
        });
    }
}

module.exports = ImageService;
