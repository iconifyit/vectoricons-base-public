const SetEntity     = require('./SetEntity');
const SetRepository = require('./SetRepository');
const BaseService   = require('../../common/BaseService');
const DB            = require('@vectoricons.net/db');
const { withSoftDeletable, withActivatable } = require('../../common/mixins/service');

/**
 * SetService class
 * @class SetService
 * @description This class is responsible for managing set data.
 * It provides methods to interact with the SetRepository and perform operations on SetEntity.
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