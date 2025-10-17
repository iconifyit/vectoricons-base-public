// Path: src/products/sets/SetEntity.js
const { createEntityFromModel } = require('../../common/BaseEntity');
const DB = require('@vectoricons.net/db');

/**
 * Represents a Set item in the system.
 * Extends BaseEntity to include common entity functionality.
 * @see {@link ../../../refs/db-models/sets.js} Objection.js model for sets
 */
class SetEntity extends createEntityFromModel(DB.sets, {}, {
    allowedColumns: [
        'id',
        'name',
        'price',
        'familyId',
        'licenseId',
        'typeId',
        'styleId',
        'teamId',
        'uniqueId',
        'userId',
        'description',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
        'isDeleted'
    ],
    relatedEntities: {
        popularity    : () => require('../purchased-items/PurchasedItemEntity'),
        family        : () => require('../families/FamilyEntity'),
        icons         : () => require('../icons/IconEntity'),
        illustrations : () => require('../illustrations/IllustrationEntity'),
        owner         : () => require('../../users/UserEntity'),
        teamType      : () => require('../../teams/team-types/TeamTypeEntity'),
        images        : () => require('../../images/ImageEntity'),
        license       : () => require('../../licenses/LicenseEntity'),
        productsType  : () => require('../product-types/ProductTypeEntity'),
        style         : () => require('../styles/StyleEntity'),
        team          : () => require('../../teams/TeamEntity'),
        user          : () => require('../../users/UserEntity'),
        tags          : () => require('../tags/TagEntity'),
    },
}) {}

module.exports = SetEntity;