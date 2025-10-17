const DB = require('@vectoricons.net/db');
const BaseRepository = require('../../common/BaseRepository');
const IllustrationEntity = require('./IllustrationEntity');

class IllustrationRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'illustrations',
            entityClass: IllustrationEntity,
        });
    }

    findByUniqueId(uniqueId, options = {}) {
        return this.findOne({ unique_id: uniqueId }, {
            ...options,
            entityClass: IllustrationEntity
        });
    }

    findBySetId(setId, options = {}) {
        return this.findAll({ set_id: setId, is_deleted: false }, {
            ...options,
            entityClass: IllustrationEntity
        });
    }

    findAllActive(options = {}) {
        return this.findAll({ is_deleted: false, is_active: true }, {
            ...options,
            entityClass: IllustrationEntity
        });
    }
}

module.exports = IllustrationRepository;