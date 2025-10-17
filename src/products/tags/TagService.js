// Path: src/products/tags/TagService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const TagRepository = require('./TagRepository');
const TagEntity = require('./TagEntity');
const { withActivatable } = require('../../common/mixins/service');

/**
 * @module Products Domain
 * @fileoverview TagService - Service for managing tags with activation support.
 * @class TagService
 */
class TagService extends withActivatable(BaseService) {
    constructor({ repository, entityClass } = {}) {
        super({
            repository: repository || new TagRepository({ DB }),
            entityClass: entityClass || TagEntity,
        });
    }
}

module.exports = TagService;
