const BaseRepository = require('../../common/BaseRepository');
const { Icons }      = require('@vectoricons.net/db');
const IconEntity     = require('./IconEntity');


class IconRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB,
            modelName: 'icons',
            entityClass: IconEntity,
        });
    }

    findByUniqueId(uniqueId, options = {}) {
        return this.findOne({ unique_id: uniqueId }, {
            ...options,
            entityClass: IconEntity
        });
    }

    findBySetId(setId, options = {}) {
        return this.findAll({ set_id: setId, is_deleted: false }, {
            ...options,
            entityClass: IconEntity
        });
    }

    findAllActive(options = {}) {
        return this.findAll({ is_deleted: false, is_active: true }, {
            ...options,
            entityClass: IconEntity
        });
    }
}

module.exports = IconRepository;