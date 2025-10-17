// Path: src/products/families/FamilyEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a Family item in the system.
 * Extends BaseEntity to include common entity functionality.
 */
class FamilyEntity extends createEntityFromModel(DB.families, {}, {
    allowedColumns: [
        'id',
        'name',
        'price',
        'description',
        'licenseId',
        'teamId',
        'uniqueId',
        'userId',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    relatedEntities: {
        popularity    : () => require('../purchased-items/PurchasedItemEntity'),
        sets          : () => require('../sets/SetEntity'),
        icons         : () => require('../icons/IconEntity'),
        illustrations : () => require('../illustrations/IllustrationEntity'),
        owner         : () => require('../../users/UserEntity'),
        teamType      : () => require('../../teams/team-types/TeamTypeEntity'),
    },
}) {}

module.exports = FamilyEntity;