const { createEntityFromModel } = require('../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a favorite item in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class FavoriteEntity extends createEntityFromModel(DB.favorites, {}, {
    allowedColumns: [
        'id',
        'entity_id',
        'entity_type',
        'user_id',
        'created_at',
        'updated_at',
        'is_active'
    ],
    relatedEntities: {
        user: () => require('../users/UserEntity'),
    },
}) {}

module.exports = FavoriteEntity;
