// Path: src/products/tags/TagService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const TagRepository = require('./TagRepository');
const TagEntity = require('./TagEntity');
const { withActivatable } = require('../../common/mixins/service');

/**
 * @class TagService
 * @description Service for managing tags with activation support.
 * @extends BaseService
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
