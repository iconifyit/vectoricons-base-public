// Path: src/products/families/FamilyService.js
const BaseService = require('../../common/BaseService');
const FamilyEntity = require('./FamilyEntity');
const FamilyRepository = require('./FamilyRepository');
const DB = require('@vectoricons.net/db');
const { withSoftDeletable, withActivatable } = require('../../common/mixins/service');

/**
 * FamilyService class
 * @class FamilyService
 * @description This class is responsible for managing family data.
 * It provides methods to interact with the FamilyRepository and perform operations on FamilyEntity.
 * Supports soft delete and activation management.
 */
class FamilyService extends withSoftDeletable(withActivatable(BaseService)) {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new FamilyRepository({ DB }),
            entityClass: entityClass || FamilyEntity,
        });
    }

    async getFamilyByUniqueId(uniqueId, options = {}) {
        return this.repository.findByUniqueId(uniqueId, options);
    }

    async getAllActiveFamilies(options = {}) {
        return this.repository.findAllActive(options);
    }
}

module.exports = FamilyService;