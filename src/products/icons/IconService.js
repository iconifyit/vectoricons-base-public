const DB = require('@vectoricons.net/db');
const IconEntity     = require('./IconEntity');
const IconRepository = require('./IconRepository');
const BaseService = require('../../common/BaseService');

const { withPluggableCacheableAndSoftDeletable } = require('../../common/mixins/service');
const { withActivatable } = require('../../common/mixins/service');

/**
 * IconService
 * Composes BaseService with Observability + (Pluggable + Cacheable + SoftDelete + Activatable) mixins.
 */
class IconService extends withActivatable(withPluggableCacheableAndSoftDeletable(BaseService)) {
    constructor({ repository = new IconRepository({ DB }), entityClass = IconEntity } = {}) {
        super({ repository, entityClass });
    }

    async getIconByUniqueId(uniqueId, options = {}) {
        return this.repository.findByUniqueId(uniqueId, options);
    }

    async getIconsBySetId(setId, options = {}) {
        return this.repository.findBySetId(setId, options);
    }

    async getAllActiveIcons(options = {}) {
        return this.repository.findAllActive(options);
    }
}

module.exports = IconService;