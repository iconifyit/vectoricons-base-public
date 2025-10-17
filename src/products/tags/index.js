// Path: src/banned-words/index.js
const DB = require('@vectoricons.net/db');
const TagEntity = require('./TagEntity');
const TagRepository = require('./TagRepository');
const TagService = require('./TagService');

/**
 * Initializes the TagService with injected dependencies.
 * @returns {TagService}
 */
const initTagService = () => {
    return new TagService({
        repository: new TagRepository({ DB }),
        entityClass: TagEntity,
    });
};

module.exports = {
    TagEntity,
    TagRepository,
    TagService,
    initTagService,
};
