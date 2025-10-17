const SetEntity     = require('./SetEntity');
const SetRepository = require('./SetRepository');
const BaseService   = require('../../common/BaseService');
const DB            = require('@vectoricons.net/db');
const { withSoftDeletable, withActivatable } = require('../../common/mixins/service');

/**
 * @module Products Domain
 * @fileoverview SetService - Service for managing set data with soft delete and activation support.
 * @class SetService
 */
class SetService extends withSoftDeletable(withActivatable(BaseService)) {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new SetRepository({ DB }),
            entityClass: entityClass || SetEntity,
        });
    }

    async getSetByUniqueId(uniqueId, options = {}) {
        return this.repository.findByUniqueId(uniqueId, options);
    }

    async getSetsByFamilyId(familyId, options = {}) {
        return this.repository.findByFamilyId(familyId, options);
    }

    async getAllActiveSets(options = {}) {
        return this.repository.findAllActive(options);
    }
}

module.exports = SetService;