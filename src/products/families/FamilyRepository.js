// Path: src/familys/FamilyRepository.js
const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const FamilyEntity = require('./FamilyEntity');

/**
 * Provides DB operations for familys.
 * @extends BaseRepository
 */
class FamilyRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'families',
            entityClass: FamilyEntity,
        });
    }

    findByUniqueId(uniqueId, options = {}) {
        return this.findOne({ unique_id: uniqueId }, {
            ...options,
            entityClass: FamilyEntity
        });
    }

    findAllActive(options = {}) {
        return this.findAll({ is_deleted: false, is_active: true }, {
            ...options,
            entityClass: FamilyEntity
        });
    }
}

module.exports = FamilyRepository;
