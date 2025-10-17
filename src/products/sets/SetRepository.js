const BaseRepository = require('../../common/BaseRepository');
const { Sets }       = require('@vectoricons.net/db');
const SetEntity      = require('./SetEntity');

class SetRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'sets',
            entityClass: SetEntity,
        });
    }

    findByUniqueId(uniqueId, options = {}) {
        return this.findOne({ unique_id: uniqueId }, {
            ...options,
            entityClass: SetEntity,
        });
    }

    findAllActive(options = {}) {
        return this.findAll({ is_deleted: false, is_active: true }, {
            ...options,
            entityClass: SetEntity
        });
    }

    findByFamilyId(familyId, options = {}) {
        return this.findAll({ family_id: familyId }, {
            ...options,
            entityClass: SetEntity
        });
    }
}

module.exports = SetRepository;