const DB = require('@vectoricons.net/db');
const IllustrationEntity     = require('./IllustrationEntity');
const IllustrationRepository = require('./IllustrationRepository');
const BaseService = require('../../common/BaseService');

const { withPluggableCacheableAndSoftDeletable } = require('../../common/mixins/service');
const { withActivatable } = require('../../common/mixins/service');

/**
 * @module Products Domain
 * @fileoverview IllustrationService - Composes BaseService with Observability + (Pluggable + Cacheable + SoftDelete + Activatable) mixins.
 */
class IllustrationService extends withActivatable(withPluggableCacheableAndSoftDeletable(BaseService)) {
    constructor({ repository = new IllustrationRepository({ DB }), entityClass = IllustrationEntity } = {}) {
        super({ repository, entityClass });
    }

    async getIllustrationByUniqueId(uniqueId, options = {}) {
        return this.repository.findByUniqueId(uniqueId, options);
    }

    async getIllustrationsBySetId(setId, options = {}) {
        return this.repository.findBySetId(setId, options);
    }

    async getAllActiveIllustrations(options = {}) {
        return this.repository.findAllActive(options);
    }
}

module.exports = IllustrationService;