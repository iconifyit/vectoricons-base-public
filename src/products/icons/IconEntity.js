// Path: src/products/icons/IconEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * @module Products Domain
 * @fileoverview IconEntity - Immutable icon representation.
 */
class IconEntity extends createEntityFromModel(DB.icons, {}, {
    allowedColumns: [
        'id',
        'name',
        'price',
        'width',
        'height',
        'setId',
        'styleId',
        'teamId',
        'userId',
        'uniqueId',
        'licenseId',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    relatedEntities: {
        popularity    : () => require('../purchased-items/PurchasedItemEntity'),
        set           : () => require('../sets/SetEntity'),
        style         : () => require('../styles/StyleEntity'),
        images        : () => require('../../images/ImageEntity'),
        tags          : () => require('../tags/TagEntity'),
        team          : () => require('../../teams/TeamEntity'),
        license       : () => require('../../licenses/LicenseEntity'),
        user          : () => require('../../users/UserEntity'),
    },
}) {}

module.exports = IconEntity;